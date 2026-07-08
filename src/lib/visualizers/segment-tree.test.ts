import { describe, it, expect } from "vitest";
import type { ValueNode } from "@/types/snapshot";
import { isSegmentTree, buildSegmentTree } from "./segment-tree";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const arr = (ns: number[]): ValueNode => ({ kind: "list", pyType: "list", repr: `[${ns.join(", ")}]`, items: ns.map(vint) });

const SEG_CODE = "def update(i, x):\n    i += n\n    tree[i] = x\n    i >>= 1\n    while i:\n        tree[i] = tree[2*i] + tree[2*i+1]\n        i >>= 1";

describe("isSegmentTree", () => {
  it("accepts a seg-named number array when source uses 2*i child indexing", () => {
    expect(isSegmentTree("tree", arr([0, 10, 3, 7, 1, 2, 3, 4]), SEG_CODE)).toBe(true);
    expect(isSegmentTree("seg", arr([0, 10, 3, 7]), "x = seg[2*node]")).toBe(true);
  });
  it("rejects without the child-indexing signal", () => {
    expect(isSegmentTree("tree", arr([0, 10, 3, 7]), "tree = [0]*n")).toBe(false);
  });
  it("rejects non-seg names and too-short / non-numeric arrays", () => {
    expect(isSegmentTree("nums", arr([0, 10, 3, 7]), SEG_CODE)).toBe(false);
    expect(isSegmentTree("tree", arr([0, 10]), SEG_CODE)).toBe(false);
  });
});

describe("buildSegmentTree", () => {
  it("assigns exact ranges for a perfect (power-of-two) tree", () => {
    // len 8 ⇒ n=4, root [0,3]; leaves at 4..7 = [0,0]..[3,3]
    const t = buildSegmentTree(arr([0, 10, 3, 7, 1, 2, 3, 4]));
    expect(t.ranged).toBe(true);
    expect(t.n).toBe(4);
    expect(t.root!.covers).toEqual([0, 3]);
    const byIdx = new Map(t.nodes.map((s) => [s.index, s]));
    expect(byIdx.get(2)!.covers).toEqual([0, 1]);
    expect(byIdx.get(3)!.covers).toEqual([2, 3]);
    expect(byIdx.get(4)!.covers).toEqual([0, 0]);
    expect(byIdx.get(7)!.covers).toEqual([3, 3]);
    expect(t.nodes).toHaveLength(7); // indices 1..7
  });

  it("draws values without ranges and prunes zero padding for a non-perfect array", () => {
    // len 6 (not power of two): ranges omitted; trailing all-zero subtrees pruned.
    const t = buildSegmentTree(arr([0, 13, 10, 3, 0, 0]));
    expect(t.ranged).toBe(false);
    expect(t.root!.covers).toBeNull();
    // index 4/5 are zero ⇒ pruned; rendered nodes are 1,2,3.
    expect(t.nodes.map((s) => s.index).sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });
});
