import { describe, it, expect } from "vitest";
import type { Snapshot, ValueNode } from "@/types/snapshot";
import { classifyProgram } from "./classify";

// ── tiny ValueNode / Snapshot builders ────────────────────────────────────────
const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const vbool = (b: boolean): ValueNode => ({ kind: "bool", pyType: "bool", repr: b ? "True" : "False", value: b });
const vnone = (): ValueNode => ({ kind: "none", pyType: "NoneType", repr: "None", value: null });
const vlist = (items: ValueNode[]): ValueNode => ({
  kind: "list", pyType: "list", repr: `[${items.map((i) => i.repr).join(", ")}]`, items,
});
const vdict = (pairs: [ValueNode, ValueNode][]): ValueNode => ({
  kind: "dict", pyType: "dict", repr: "{...}", entries: pairs.map(([key, value]) => ({ key, value })),
});
const vobj = (pyType: string, attrs: Record<string, ValueNode>, id = 1): ValueNode => ({
  kind: "object", pyType, repr: `<${pyType}>`, id,
  attributes: Object.entries(attrs).map(([name, value]) => ({ name, value })),
});

let step = 0;
const snap = (fn: string, locals: Record<string, ValueNode>): Snapshot => ({
  step: step++, line: 1, event: "line", stdout: "",
  stack: [{ functionName: fn, line: 1, locals: Object.entries(locals).map(([name, value]) => ({ name, value })) }],
});

describe("classifyProgram — structure beats name heuristics", () => {
  it("classifies a Trie as 'trie' even though it has a search() method", () => {
    const code = "class Trie:\n    def insert(self, w):\n        for c in w: pass\n    def search(self, w):\n        for c in w: pass";
    const node = vobj("TrieNode", { children: vdict([]), is_end: vbool(false) });
    const summary = classifyProgram(code, [snap("insert", { node })]);
    expect(summary.kind).toBe("trie");
  });

  it("classifies a linked list as 'linked-list' despite a search() method", () => {
    const code = "class LinkedList:\n    def search(self, d):\n        curr = self.head\n        while curr: curr = curr.next";
    const curr = vobj("Node", { data: vint(1), next: vnone() });
    const summary = classifyProgram(code, [snap("search", { curr })]);
    expect(summary.kind).toBe("linked-list");
  });

  it("still classifies a genuine array scan as 'linear-search'", () => {
    const code = "def search(arr, target):\n    for x in arr:\n        if x == target:\n            return True\n    return False";
    const s = snap("search", { arr: vlist([vint(1), vint(2)]), target: vint(2), x: vint(1) });
    expect(classifyProgram(code, [s]).kind).toBe("linear-search");
  });

  it("detects a sort from an element swap across steps", () => {
    const code = "def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr)-1):\n            arr[j], arr[j+1] = arr[j+1], arr[j]";
    const s0 = snap("bubble_sort", { arr: vlist([vint(3), vint(1)]) });
    const s1 = snap("bubble_sort", { arr: vlist([vint(1), vint(3)]) });
    expect(classifyProgram(code, [s0, s1]).kind).toBe("sort");
  });

  it("detects backtracking (recursive candidate build) over generic recursion", () => {
    const code = "def subsets(nums):\n    res = []\n    def backtrack(start, path):\n        res.append(path[:])\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            backtrack(i + 1, path)\n            path.pop()\n    backtrack(0, [])\n    return res";
    const frame = (fn: string, locals: Record<string, ValueNode>) => ({
      functionName: fn, line: 1,
      locals: Object.entries(locals).map(([name, value]) => ({ name, value })),
    });
    // A recursive stack: two nested `backtrack` frames → recursionDepth > 1.
    const s: Snapshot = {
      step: 0, line: 1, event: "line", stdout: "",
      stack: [
        frame("subsets", { res: vlist([]) }),
        frame("backtrack", { start: vint(0), path: vlist([]) }),
        frame("backtrack", { start: vint(1), path: vlist([vint(1)]) }),
      ],
    };
    expect(classifyProgram(code, [s]).kind).toBe("backtracking");
  });

  it("falls back to 'script' for a plain program", () => {
    const code = "x = 1\ny = 2\nz = x + y";
    expect(classifyProgram(code, [snap("<module>", { x: vint(1), y: vint(2) })]).kind).toBe("script");
  });
});
