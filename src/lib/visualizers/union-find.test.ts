import { describe, it, expect } from "vitest";
import type { ValueNode } from "@/types/snapshot";
import { isUnionFind, buildForest } from "./union-find";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const arr = (ns: number[]): ValueNode => ({ kind: "list", pyType: "list", repr: `[${ns.join(", ")}]`, items: ns.map(vint) });

describe("isUnionFind", () => {
  it("accepts a DSU-named self-index array", () => {
    expect(isUnionFind("parent", arr([0, 0, 2, 2]))).toBe(true);
    expect(isUnionFind("root", arr([0, 1]))).toBe(true);
  });
  it("rejects non-DSU names and out-of-range values", () => {
    expect(isUnionFind("nums", arr([0, 0, 2]))).toBe(false);
    expect(isUnionFind("parent", arr([0, 9]))).toBe(false); // 9 not a valid index
  });
});

describe("buildForest", () => {
  it("groups elements into components by root", () => {
    // 0←1, 2←3  ⇒ two sets {0,1} and {2,3}
    const { components } = buildForest(arr([0, 0, 2, 2]));
    expect(components).toHaveLength(2);
    const roots = components.map((c) => c.root).sort();
    expect(roots).toEqual([0, 2]);
    const set0 = components.find((c) => c.root === 0)!;
    expect(set0.members.sort()).toEqual([0, 1]);
  });

  it("handles a fully-merged forest (one set)", () => {
    const { components } = buildForest(arr([0, 0, 1, 2]));
    expect(components).toHaveLength(1);
    expect(components[0].members.sort()).toEqual([0, 1, 2, 3]);
  });
});
