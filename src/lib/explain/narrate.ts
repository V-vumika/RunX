/**
 * Step narrator — turns the trace into plain English, one line per step.
 *
 * This is the Thonny-grade core of RunX's "explain any code" experience, and it
 * is deliberately rules-based: it reads the {@link Snapshot} stream we already
 * produce and describes the *transition* between consecutive steps. No LLM, no
 * API key, works offline. The optional LLM layer (src/lib/ai/explain.ts) sits
 * on top of this — it never replaces it.
 *
 * Mechanics: a "line" snapshot captures program state *before* a line runs
 * (see snapshot.ts), so the diff between snapshot[i-1] and snapshot[i] is the
 * *effect of the line that just executed* (prev.line). "call"/"return"/
 * "exception" events are described directly from the event rather than a diff,
 * because the two snapshots straddle a frame push/pop and a name-based local
 * diff across different frames would be meaningless.
 *
 * Reuses diffFrames (step-diff.ts) and enrichFrames (stack-analysis.ts) so the
 * recursion/aliasing logic lives in one place.
 */

import type { Snapshot, StackFrame, ValueNode } from "@/types/snapshot";
import { diffFrames } from "@/lib/visualizers/step-diff";
import { enrichFrames } from "@/lib/visualizers/stack-analysis";

export type StepKind =
  | "start"
  | "call"
  | "return"
  | "assign"
  | "mutate"
  | "branch"
  | "loop"
  | "print"
  | "error"
  | "step";

export interface StepExplanation {
  /** One-line, plain-English description of what this step did. */
  text: string;
  /** Source line that produced this step (for the editor-style "Now running" row). */
  line: number;
  /** Trimmed source text of `line`, when the code was provided. */
  detail?: string;
  /** Category — drives icon/colour in the panel. */
  kind: StepKind;
  /** Variable names this step touched (lets the panel cross-highlight). */
  touched: string[];
  /** Call-stack depth at this step (1 = module scope); set by narrateAll. */
  depth?: number;
}

const MAX = 44;

/** Short, display-safe repr of a value node. */
export function shortRepr(node: ValueNode | undefined | null, max = MAX): string {
  if (!node) return "?";
  const r = node.repr ?? "";
  return r.length > max ? `${r.slice(0, max - 1)}…` : r;
}

function topFrame(s: Snapshot | null | undefined): StackFrame | null {
  return s?.stack[s.stack.length - 1] ?? null;
}

function varMap(frame: StackFrame | null): Map<string, ValueNode> {
  const m = new Map<string, ValueNode>();
  if (!frame) return m;
  for (const v of frame.locals) {
    if (!v.name.startsWith("__")) m.set(v.name, v.value);
  }
  return m;
}

const SEQ_KINDS = new Set(["list", "tuple", "deque"]);

function reprs(node: ValueNode): string[] {
  return (node.items ?? []).map((it) => it.repr);
}

/**
 * Describe how a sequence (list/tuple/deque) changed: append, pop, swap, set,
 * etc. Returns null when nothing recognizable changed (caller falls back).
 */
export function describeSeqChange(
  name: string,
  prev: ValueNode,
  curr: ValueNode
): string | null {
  if (!SEQ_KINDS.has(prev.kind) || !SEQ_KINDS.has(curr.kind)) return null;
  const p = reprs(prev);
  const c = reprs(curr);

  if (c.length === p.length) {
    const diffIdx: number[] = [];
    for (let i = 0; i < c.length; i++) if (c[i] !== p[i]) diffIdx.push(i);
    if (diffIdx.length === 0) return null;
    if (diffIdx.length === 2) {
      const [i, j] = diffIdx;
      if (p[i] === c[j] && p[j] === c[i]) {
        return `swapped \`${name}[${i}]\` ↔ \`${name}[${j}]\``;
      }
    }
    if (diffIdx.length === 1) {
      const i = diffIdx[0];
      return `set \`${name}[${i}]\` = ${shortRepr(curr.items?.[i])}`;
    }
    return `updated ${diffIdx.length} items in \`${name}\``;
  }

  if (c.length === p.length + 1) {
    const prefixEqual = p.every((v, i) => v === c[i]);
    if (prefixEqual) return `appended ${shortRepr(curr.items?.[c.length - 1])} to \`${name}\``;
    const suffixEqual = p.every((v, i) => v === c[i + 1]);
    if (suffixEqual) return `pushed ${shortRepr(curr.items?.[0])} to the front of \`${name}\``;
    return `added an item to \`${name}\` (now ${c.length})`;
  }

  if (c.length === p.length - 1) {
    const prefixEqual = c.every((v, i) => v === p[i]);
    if (prefixEqual) return `removed ${shortRepr(prev.items?.[p.length - 1])} from the end of \`${name}\``;
    const suffixEqual = c.every((v, i) => v === p[i + 1]);
    if (suffixEqual) return `removed ${shortRepr(prev.items?.[0])} from the front of \`${name}\``;
    return `removed an item from \`${name}\` (now ${c.length})`;
  }

  return `\`${name}\` changed (${p.length} → ${c.length} items)`;
}

function describeDictChange(name: string, prev: ValueNode, curr: ValueNode): string | null {
  if (prev.kind !== "dict" || curr.kind !== "dict") return null;
  const pEntries = new Map((prev.entries ?? []).map((e) => [e.key.repr, e.value.repr]));
  const cEntries = curr.entries ?? [];
  const changed: { key: string; val: ValueNode }[] = [];
  for (const e of cEntries) {
    if (pEntries.get(e.key.repr) !== e.value.repr) changed.push({ key: e.key.repr, val: e.value });
  }
  if (changed.length === 1) return `set \`${name}[${changed[0].key}]\` = ${shortRepr(changed[0].val)}`;
  if (changed.length > 1) return `updated ${changed.length} keys in \`${name}\``;
  if (cEntries.length !== pEntries.size) return `\`${name}\` now has ${cEntries.length} keys`;
  return null;
}

/** Describe a single variable's change (created / mutated / reassigned). */
function describeVarChange(
  name: string,
  prev: ValueNode | undefined,
  curr: ValueNode
): { text: string; kind: StepKind } {
  if (!prev) {
    return { text: `set \`${name}\` = ${shortRepr(curr)}`, kind: "assign" };
  }
  const seq = describeSeqChange(name, prev, curr);
  if (seq) return { text: seq, kind: "mutate" };
  const dict = describeDictChange(name, prev, curr);
  if (dict) return { text: dict, kind: "mutate" };
  // Scalars and everything else: show old → new.
  return { text: `\`${name}\`: ${shortRepr(prev)} → ${shortRepr(curr)}`, kind: "assign" };
}

function lineKeyword(src: string | undefined): StepKind {
  const t = (src ?? "").trim();
  if (/^(if|elif|else)\b/.test(t)) return "branch";
  if (/^(for|while)\b/.test(t)) return "loop";
  return "step";
}

/**
 * Adds a short "why" to a mechanical change, given the detected algorithm kind.
 * `kind` is a plain string (the classifier's AlgoKind) — kept untyped here to
 * avoid a circular import between narrate.ts and classify.ts. Only added for
 * cases where the intent is reliably true regardless of the specific code.
 */
function intentSuffix(kind: string | undefined, text: string): string {
  if (!kind) return "";
  if (kind === "sort" && text.includes("swapped")) return " — a step toward sorted order";
  if (kind === "binary-search" && /`(mid|lo|hi|low|high)`/.test(text)) {
    return " — narrowing the search range";
  }
  return "";
}

/**
 * Explain the transition from `prev` to `curr`. `prev` is null at step 0.
 * `codeLines` (the program split on "\n") is optional but lets the narrator
 * attach the source line and read condition/loop keywords.
 */
export function narrateStep(
  prev: Snapshot | null,
  curr: Snapshot,
  codeLines?: string[],
  kind?: string
): StepExplanation {
  const srcAt = (line: number) => codeLines?.[line - 1]?.trim();

  // ── Frame push: a function was called ──
  if (curr.event === "call") {
    const top = topFrame(curr);
    const enriched = enrichFrames(curr.stack);
    const me = enriched[enriched.length - 1];
    const args = top ? varMap(top) : new Map<string, ValueNode>();
    const argStr = [...args].map(([n, v]) => `${n}=${shortRepr(v, 18)}`).join(", ");
    let text = `Call \`${top?.functionName ?? "?"}(${argStr})\``;
    if (me?.isRecursive) text += ` — recursive call #${me.recursionIndex}`;
    return { text, line: curr.line, detail: srcAt(curr.line), kind: "call", touched: [...args.keys()] };
  }

  // ── Frame pop: a function returned ──
  if (curr.event === "return") {
    const name = topFrame(curr)?.functionName ?? "function";
    const rv = curr.returnValue;
    const text = rv ? `\`${name}()\` returns ${shortRepr(rv)}` : `\`${name}()\` returns`;
    return { text, line: curr.line, detail: srcAt(curr.line), kind: "return", touched: [] };
  }

  if (curr.event === "exception") {
    return {
      text: `Exception raised at line ${curr.line}`,
      line: curr.line,
      detail: srcAt(curr.line),
      kind: "error",
      touched: [],
    };
  }

  // ── First step ──
  if (!prev) {
    return { text: "Program starts.", line: curr.line, detail: srcAt(curr.line), kind: "start", touched: [] };
  }

  const prevTop = topFrame(prev);
  const currTop = topFrame(curr);
  const sameFrame = !!(
    prevTop &&
    currTop &&
    prevTop.functionName === currTop.functionName &&
    prev.stack.length === curr.stack.length
  );

  // Pick the earlier version of *this* frame to diff against. Normally that's
  // the previous snapshot's top frame; but right after returning up into a
  // caller, the previous snapshot's top is the callee — the caller as it was
  // during the call sits one level down in prev.stack, and diffing against it
  // correctly surfaces the assigned return value (e.g. `result = 24`).
  let comparePrev: StackFrame | null = sameFrame ? prevTop : null;
  if (!comparePrev && prevTop && currTop && prev.stack.length > curr.stack.length) {
    const caller = prev.stack[curr.stack.length - 1];
    if (caller && caller.functionName === currTop.functionName) comparePrev = caller;
  }

  if (!comparePrev) {
    const where = currTop?.functionName === "<module>" ? "module scope" : `\`${currTop?.functionName}()\``;
    return { text: `Continue in ${where}`, line: curr.line, detail: srcAt(curr.line), kind: "step", touched: [] };
  }

  // Effects are attributed to the line that produced them: the just-run line
  // in the same frame, or the caller's call line when returning up.
  const ranLine = sameFrame ? prev.line : curr.line;
  const ranSrc = srcAt(ranLine);

  const diff = diffFrames(comparePrev, currTop);
  const pMap = varMap(comparePrev);
  const cMap = varMap(currTop);

  const parts: { text: string; kind: StepKind; name: string }[] = [];
  for (const name of diff.added) {
    const node = cMap.get(name);
    if (node) parts.push({ ...describeVarChange(name, undefined, node), name });
  }
  for (const name of diff.changed) {
    const node = cMap.get(name);
    if (node) parts.push({ ...describeVarChange(name, pMap.get(name), node), name });
  }

  if (parts.length === 0) {
    // Nothing visible changed: a condition check, a loop header, or a print.
    if ((curr.stdout?.length ?? 0) > (prev.stdout?.length ?? 0)) {
      return { text: "Printed to output", line: ranLine, detail: ranSrc, kind: "print", touched: [] };
    }
    const k = lineKeyword(ranSrc);
    const text =
      k === "branch" ? "Checked a condition"
      : k === "loop" ? "Loop check"
      : `Ran line ${ranLine}`;
    return { text, line: ranLine, detail: ranSrc, kind: k, touched: [] };
  }

  const shown = parts.slice(0, 2).map((p) => p.text).join("; ");
  const extra = parts.length > 2 ? ` (+${parts.length - 2} more)` : "";
  const base = shown + extra;
  return {
    text: base + intentSuffix(kind, base),
    line: ranLine,
    detail: ranSrc,
    kind: parts.some((p) => p.kind === "mutate") ? "mutate" : "assign",
    touched: parts.map((p) => p.name),
  };
}

const VALUE_NOISE = new Set(["self", "True", "False", "None"]);

/**
 * First step toward Thonny-style sub-expression view: the live values of the
 * variables named on a source line. Pure name lookup against the frame's
 * locals (so keywords/builtins/functions are naturally excluded) — not a real
 * expression evaluator, but it lets a learner see what fed the line.
 */
export function valuesOnLine(
  src: string | undefined,
  frame: StackFrame | null
): { name: string; repr: string }[] {
  if (!src || !frame) return [];
  const locals = varMap(frame);
  const out: { name: string; repr: string }[] = [];
  const seen = new Set<string>();
  for (const m of src.matchAll(/[A-Za-z_]\w*/g)) {
    const name = m[0];
    if (seen.has(name) || VALUE_NOISE.has(name)) continue;
    const node = locals.get(name);
    if (node) {
      out.push({ name, repr: shortRepr(node, 28) });
      seen.add(name);
    }
  }
  return out;
}

/** Narrate every step once (memoize on snapshots + code in the panel). */
export function narrateAll(snapshots: Snapshot[], code: string, kind?: string): StepExplanation[] {
  const lines = code.split("\n");
  return snapshots.map((s, i) => {
    const e = narrateStep(i > 0 ? snapshots[i - 1] : null, s, lines, kind);
    return { ...e, depth: s.stack.length };
  });
}
