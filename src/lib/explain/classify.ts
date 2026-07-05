/**
 * Program classifier — answers "what kind of code is this?" from the source
 * plus the runtime trace, so the Explain panel can show a one-line summary
 * ("Looks like Bubble Sort · O(n²)") and the right visualizer can auto-open.
 *
 * This is RULES-BASED by design and by project rule: the complexity *class* is
 * always decided here (loop nesting + recursion shape + known signatures),
 * never by the LLM. The LLM only ever writes prose on top of these facts.
 *
 * Complexity facts come from Python's `ast` module (computed in the worker,
 * arrives as ComplexityInfo) — accurate loop nesting and recursion shape,
 * unlike the old indentation heuristic. We fall back to a textual heuristic
 * only when AST analysis is unavailable (e.g. the program failed to parse).
 */

import type { ComplexityInfo, RecursionInfo, Snapshot, ValueNode } from "@/types/snapshot";
import { detectStructure } from "@/lib/visualizers/structure-detect";
import { describeSeqChange } from "@/lib/explain/narrate";

export type AlgoKind =
  | "sort"
  | "binary-search"
  | "linear-search"
  | "bfs"
  | "dfs"
  | "tree"
  | "linked-list"
  | "trie"
  | "backtracking"
  | "recursion"
  | "nested-loop"
  | "iterative"
  | "script";

export interface ProgramSummary {
  /** Display title, e.g. "Bubble Sort" or "Recursive algorithm". */
  title: string;
  kind: AlgoKind;
  /** Big-O class as a string, or "—" when not determinable. */
  complexity: string;
  /** Why that class — cites the concrete signal that decided it. */
  complexityReason: string;
  /** One or two sentences describing what the program does. */
  description: string;
  /** The teaching takeaway — the "aha" behind this algorithm/pattern. */
  keyIdea?: string;
  /** Short bullet observations shown under the summary. */
  signals: string[];
}

// ── Source-level fallback (used only when AST analysis is unavailable) ───────

/** Max simultaneously-open *loop* headers by indentation — a rough fallback. */
function maxLoopNesting(code: string): number {
  const stack: { indent: number; loop: boolean }[] = [];
  let max = 0;
  for (const raw of code.split("\n")) {
    const line = raw.replace(/\t/g, "    ");
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (trimmed.endsWith(":")) stack.push({ indent, loop: /^(for|while)\b/.test(trimmed) });
    const depth = stack.filter((s) => s.loop).length;
    if (depth > max) max = depth;
  }
  return max;
}

function definedFunctions(code: string): string[] {
  const names: string[] = [];
  for (const m of code.matchAll(/^\s*def\s+([A-Za-z_]\w*)\s*\(/gm)) names.push(m[1]);
  return names;
}

// ── Runtime signals ─────────────────────────────────────────────────────────

interface RuntimeSignals {
  recursive: boolean;
  recursionDepth: number;
  recursiveFn: string;
  sawSwap: boolean;
  trie: boolean;
  structures: Set<string>;
}

function analyzeTrace(snapshots: Snapshot[]): RuntimeSignals {
  let recursionDepth = 0;
  let recursiveFn = "";
  let sawSwap = false;
  let trie = false;
  const structures = new Set<string>();

  const seqVarsAt = (s: Snapshot): Map<string, ValueNode> => {
    const m = new Map<string, ValueNode>();
    const top = s.stack[s.stack.length - 1];
    if (!top) return m;
    for (const v of top.locals) {
      if (!v.name.startsWith("__") && ["list", "tuple", "deque"].includes(v.value.kind)) {
        m.set(v.name, v.value);
      }
    }
    return m;
  };

  for (let i = 0; i < snapshots.length; i++) {
    const s = snapshots[i];

    const counts = new Map<string, number>();
    for (const f of s.stack) counts.set(f.functionName, (counts.get(f.functionName) ?? 0) + 1);
    for (const [name, c] of counts) {
      if (c > recursionDepth) {
        recursionDepth = c;
        recursiveFn = name;
      }
    }

    for (const f of s.stack) {
      for (const v of f.locals) {
        if (v.name.startsWith("__")) continue;
        structures.add(detectStructure(v.name, v.value));
        if (!trie && looksLikeTrie(v.name, v.value)) trie = true;
      }
    }

    if (i > 0 && !sawSwap) {
      const prev = seqVarsAt(snapshots[i - 1]);
      const curr = seqVarsAt(s);
      for (const [name, currNode] of curr) {
        const prevNode = prev.get(name);
        if (prevNode && describeSeqChange(name, prevNode, currNode)?.label.toLowerCase().includes("swap")) {
          sawSwap = true;
          break;
        }
      }
    }
  }

  return { recursive: recursionDepth > 1, recursionDepth, recursiveFn, sawSwap, trie, structures };
}

/**
 * High-confidence trie signal: a node object carrying a `children` **dict**
 * (char → child), the trie's serialized `_snapshot` dict, or a dict with a
 * `children` key. Deliberately narrow — a tree uses left/right, so this won't
 * fire on ordinary trees, and requiring the dict avoids matching class bodies.
 */
function looksLikeTrie(name: string, val: ValueNode): boolean {
  if (name === "_snapshot" && val.kind === "dict") return true;
  if (
    val.kind === "object" &&
    val.attributes?.some((a) => a.name === "children" && a.value.kind === "dict")
  ) {
    return true;
  }
  if (val.kind === "dict" && val.entries?.some((e) => e.key.repr === "'children'")) {
    return true;
  }
  return false;
}

// ── Complexity from AST facts ────────────────────────────────────────────────

function nameMatches(fns: string[], re: RegExp): boolean {
  return fns.some((n) => re.test(n));
}

function complexityFromLoops(nesting: number): { c: string; why: string } {
  if (nesting >= 3) return { c: "O(n³)", why: "three nested loops over the input" };
  if (nesting === 2) return { c: "O(n²)", why: "two nested loops over the input" };
  if (nesting === 1) return { c: "O(n)", why: "a single pass over the input" };
  return { c: "O(1)", why: "no loops over the input" };
}

function primaryRecursion(recs: RecursionInfo[]): RecursionInfo | null {
  if (!recs.length) return null;
  return [...recs].sort((a, b) => b.selfCalls - a.selfCalls)[0];
}

/** Map a recursive function's call shape to a Big-O class. */
function recursionComplexity(
  rec: RecursionInfo | null,
  fns: string[],
  depth: number
): { c: string; why: string } {
  if (rec) {
    if (rec.selfCalls >= 2 && rec.shrink === "half")
      return { c: "O(n log n)", why: "splits into halves and recombines each level (divide and conquer)" };
    if (rec.selfCalls >= 2)
      return { c: "O(2ⁿ)", why: "each call spawns two more — exponential branching" };
    if (rec.shrink === "half")
      return { c: "O(log n)", why: "halves its input on every call" };
    if (rec.shrink === "decrement")
      return { c: "O(n)", why: "reduces its input by one on every call" };
  }
  if (nameMatches(fns, /fib/i)) return { c: "O(2ⁿ)", why: "each call branches into two more — exponential" };
  if (nameMatches(fns, /fact/i)) return { c: "O(n)", why: "one nested call per step down to the base case" };
  return { c: "O(n)", why: `recursion to depth ${depth} — linear in the recursion depth` };
}

// ── Classification ──────────────────────────────────────────────────────────

export function classifyProgram(
  code: string,
  snapshots: Snapshot[],
  astInfo?: ComplexityInfo | null
): ProgramSummary {
  const fns = definedFunctions(code);
  const nesting = astInfo?.maxLoopDepth ?? maxLoopNesting(code);
  const astRec = astInfo?.recursion ?? [];
  const rt = analyzeTrace(snapshots);
  const rec = primaryRecursion(astRec);
  const isRecursive = rec !== null || rt.recursive;

  const signals: string[] = [];
  if (nesting >= 2) signals.push(`${nesting} nested loops`);
  else if (nesting === 1) signals.push("one loop");
  if (isRecursive) {
    const sc = rec?.selfCalls ?? 1;
    signals.push(`recursion${sc >= 2 ? " (branching)" : ""} — depth ${rt.recursionDepth || "?"}`);
  }
  if (rt.sawSwap) signals.push("element swaps");
  for (const s of ["tree", "graph", "linked-list", "stack", "queue"]) {
    if (rt.structures.has(s)) signals.push(`${s} structure`);
  }

  const loopC = complexityFromLoops(nesting);

  // BFS / DFS
  if (nameMatches(fns, /bfs|breadth/i) || (rt.structures.has("graph") && rt.structures.has("queue"))) {
    return {
      title: "Breadth-First Search (BFS)",
      kind: "bfs",
      complexity: "O(V + E)",
      complexityReason: "visits every vertex and edge once via a queue",
      description: "Explores a graph level by level from a start node, using a queue to visit the nearest nodes first.",
      keyIdea: "A queue guarantees you always expand the closest unvisited node first — that's what makes the traversal breadth-first.",
      signals,
    };
  }
  if (nameMatches(fns, /dfs|depth/i) || (rt.structures.has("graph") && isRecursive)) {
    return {
      title: "Depth-First Search (DFS)",
      kind: "dfs",
      complexity: "O(V + E)",
      complexityReason: "visits every vertex and edge once via recursion/stack",
      description: "Explores a graph as deep as possible along each branch before backtracking.",
      keyIdea: "Recursion (or a stack) drives you down one path completely before backing up — the opposite order from BFS.",
      signals,
    };
  }

  // ── Structural data-structure detection ──────────────────────────────────
  // These come BEFORE the name/behaviour heuristics below (sort/search): the
  // actual runtime shape is far more reliable than a method being *named*
  // "search". A Trie/LinkedList/Tree class with a `search` method must classify
  // by its structure, not get caught by the linear-search name match.
  if (rt.trie) {
    return {
      title: "Trie (prefix tree)",
      kind: "trie",
      complexity: "O(m)",
      complexityReason: "each insert/search walks one node per character of the key (m = key length)",
      description: "Stores strings as a tree of characters, so words sharing a prefix share the same path.",
      keyIdea: "A shared prefix is stored once — lookup costs only the length of the word, no matter how many words are in the trie.",
      signals,
    };
  }
  if (rt.structures.has("tree")) {
    return {
      title: "Binary tree operations",
      kind: "tree",
      complexity: isRecursive ? "O(h)" : loopC.c,
      complexityReason: isRecursive ? "recurses along the tree's height h" : loopC.why,
      description: "Builds or traverses a binary tree of nodes with left/right children.",
      keyIdea: "Cost tracks the tree's height h — O(log n) when balanced, but O(n) if it degenerates into a chain.",
      signals,
    };
  }
  if (rt.structures.has("linked-list")) {
    return {
      title: "Linked-list operations",
      kind: "linked-list",
      complexity: loopC.c,
      complexityReason: "walks the list node by node",
      description: "Builds or traverses a linked list by following each node's `next` pointer.",
      keyIdea: "There's no indexing — to reach the k-th node you must walk k pointers from the head.",
      signals,
    };
  }

  // Sorting
  if (rt.sawSwap || nameMatches(fns, /sort/i)) {
    const isMerge = nameMatches(fns, /merge/i);
    const isQuick = nameMatches(fns, /quick|partition/i);
    let title = "Sorting algorithm";
    let keyIdea = "Repeatedly moves elements until the whole sequence is in order.";
    if (nameMatches(fns, /bubble/i)) {
      title = "Bubble Sort";
      keyIdea = "Each pass swaps adjacent out-of-order pairs, 'bubbling' the largest remaining value to the end.";
    } else if (nameMatches(fns, /selection/i)) {
      title = "Selection Sort";
      keyIdea = "Each pass scans for the smallest remaining element and places it next — fewer swaps, still n² comparisons.";
    } else if (nameMatches(fns, /insertion/i)) {
      title = "Insertion Sort";
      keyIdea = "Grows a sorted prefix, inserting each new element into its correct spot — fast on nearly-sorted data.";
    } else if (isMerge) {
      title = "Merge Sort";
      keyIdea = "Splits the list in half, sorts each half, then merges — the split is why it's n log n, not n².";
    } else if (isQuick) {
      title = "Quicksort";
      keyIdea = "Partitions around a pivot so smaller elements go left, larger go right, then recurses on each side.";
    }
    const divideConquer = (isMerge || isQuick) && (rec?.shrink === "half" || isRecursive);
    return {
      title,
      kind: "sort",
      complexity: divideConquer ? "O(n log n)" : nesting >= 2 ? "O(n²)" : loopC.c,
      complexityReason: divideConquer
        ? "divide-and-conquer recursion halving the input each level"
        : nesting >= 2
        ? "compares each pair via two nested loops"
        : loopC.why,
      description: "Rearranges the elements of a sequence into sorted order.",
      keyIdea,
      signals,
    };
  }

  // Binary search
  if (nameMatches(fns, /binary.?search|bisect/i) || (/\bmid\b/.test(code) && /\/\/\s*2/.test(code) && nesting >= 1)) {
    return {
      title: "Binary Search",
      kind: "binary-search",
      complexity: "O(log n)",
      complexityReason: "halves the search range every iteration",
      description: "Finds a target in a sorted sequence by repeatedly halving the search range.",
      keyIdea: "Every comparison discards half of what's left — that halving is exactly why it's O(log n). Requires sorted input.",
      signals,
    };
  }

  // Linear search
  if (nameMatches(fns, /linear.?search|find|search/i) && nesting === 1) {
    return {
      title: "Linear Search",
      kind: "linear-search",
      complexity: "O(n)",
      complexityReason: "scans the sequence one element at a time",
      description: "Scans a sequence from the start until it finds the target (or runs out).",
      keyIdea: "No assumptions about order, so there's no shortcut — worst case you touch every element.",
      signals,
    };
  }

  // Backtracking — recursive exploration that builds & unwinds a candidate.
  if (isRecursive && nameMatches(fns, /backtrack|permut|subset|combin|combo|nqueen|n_queen|generate|solve/i)) {
    return {
      title: "Backtracking",
      kind: "backtracking",
      complexity: loopC.c === "O(1)" ? "O(2ⁿ)" : loopC.c,
      complexityReason: "explores the decision tree, undoing each choice on the way back",
      description: "Builds a candidate step by step, and backtracks (undoes the last choice) when a path can't work.",
      keyIdea: "Every branch is a choice; on return you undo it, so the same slot can try the next option — that's the 'back' in backtracking.",
      signals,
    };
  }

  // Generic recursion
  if (isRecursive) {
    const fib = nameMatches(fns, /fib/i);
    const fact = nameMatches(fns, /fact/i);
    const rc = recursionComplexity(rec, fns, rt.recursionDepth);
    return {
      title: fib ? "Fibonacci (recursive)" : fact ? "Factorial (recursive)" : "Recursive algorithm",
      kind: "recursion",
      complexity: rc.c,
      complexityReason: rc.why,
      description: "Solves the problem by calling itself on smaller inputs until a base case.",
      keyIdea: fib
        ? "The naive version recomputes the same subproblems over and over — memoization collapses it to O(n)."
        : "Every recursive solution needs a base case that stops the recursion, plus a step that shrinks the input toward it.",
      signals,
    };
  }

  // Loop-shaped programs
  if (nesting >= 2) {
    return {
      title: "Nested-loop algorithm",
      kind: "nested-loop",
      complexity: loopC.c,
      complexityReason: loopC.why,
      description: "Processes the data with loops nested inside one another.",
      keyIdea: "Each extra level of nesting multiplies the work — two nested loops over n items means ~n² steps.",
      signals,
    };
  }
  if (nesting === 1) {
    return {
      title: "Iterative algorithm",
      kind: "iterative",
      complexity: "O(n)",
      complexityReason: loopC.why,
      description: "Walks through the data once with a single loop.",
      keyIdea: "A single pass scales linearly — double the input, double the work.",
      signals,
    };
  }

  return {
    title: "Python script",
    kind: "script",
    complexity: "O(1)",
    complexityReason: "no loops or recursion over an input",
    description: "A straight-line script — runs its statements top to bottom.",
    signals: signals.length ? signals : ["straight-line statements"],
  };
}

/**
 * Rules-based auxiliary space complexity, decided in the engine (never the UI).
 * Derived from the algorithm kind + AST recursion shape — the recursion call
 * stack and the extra data structures an algorithm allocates are what dominate
 * auxiliary space. Heuristic but consistent; pairs with `classifyProgram`.
 */
export function deriveSpaceComplexity(
  summary: ProgramSummary,
  astInfo?: ComplexityInfo | null
): { value: string; reason: string } {
  const rec = primaryRecursion(astInfo?.recursion ?? []);

  switch (summary.kind) {
    case "bfs":
    case "dfs":
      return { value: "O(V)", reason: "stores visited nodes plus the frontier (queue/stack)" };

    case "binary-search":
      return rec
        ? { value: "O(log n)", reason: "recursion stack proportional to the halving depth" }
        : { value: "O(1)", reason: "iterative — only a few index variables" };

    case "linear-search":
    case "iterative":
    case "nested-loop":
      return { value: "O(1)", reason: "works in place — no input-sized extra storage" };

    case "sort":
      if (/merge/i.test(summary.title))
        return { value: "O(n)", reason: "merge buffers the size of the input" };
      if (/quick/i.test(summary.title))
        return { value: "O(log n)", reason: "sorts in place; recursion stack ~log n deep" };
      return { value: "O(1)", reason: "sorts in place by swapping elements" };

    case "tree":
    case "linked-list":
      return { value: "O(n)", reason: "one node object per element" };

    case "recursion":
      if (rec?.shrink === "half")
        return { value: "O(log n)", reason: "recursion depth shrinks by half each call" };
      return { value: "O(n)", reason: "recursion stack grows with the input depth" };

    default:
      return { value: "O(1)", reason: "no input-sized extra storage" };
  }
}
