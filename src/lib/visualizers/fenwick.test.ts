import { describe, it, expect } from "vitest";
import type { ValueNode } from "@/types/snapshot";
import { isFenwick, buildFenwick } from "./fenwick";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const arr = (ns: number[]): ValueNode => ({ kind: "list", pyType: "list", repr: `[${ns.join(", ")}]`, items: ns.map(vint) });

const LOWBIT_CODE = "def update(i, x):\n    while i <= n:\n        tree[i] += x\n        i += i & -i";

describe("isFenwick", () => {
  it("accepts a BIT-named int array when the source uses lowbit", () => {
    expect(isFenwick("tree", arr([0, 1, 3, 0, 6]), LOWBIT_CODE)).toBe(true);
    expect(isFenwick("bit", arr([0, 1, 3, 0, 6]), "x = i & (-i)")).toBe(true);
  });
  it("rejects without the lowbit signal (avoids hijacking a plain list)", () => {
    expect(isFenwick("tree", arr([0, 1, 3, 0, 6]), "tree = [0]*n")).toBe(false);
  });
  it("rejects non-BIT names and non-int / too-short arrays", () => {
    expect(isFenwick("nums", arr([0, 1, 3, 0, 6]), LOWBIT_CODE)).toBe(false);
    expect(isFenwick("tree", arr([0, 1]), LOWBIT_CODE)).toBe(false);
  });
});

describe("buildFenwick", () => {
  it("computes the covered range per slot via lowbit", () => {
    // slot 0 dummy; 1→[1,1], 2→[1,2], 3→[3,3], 4→[1,4]
    const cells = buildFenwick(arr([0, 5, 8, 2, 15]));
    expect(cells[0].covers).toBeNull();
    expect(cells[1].covers).toEqual([1, 1]);
    expect(cells[2].covers).toEqual([1, 2]);
    expect(cells[3].covers).toEqual([3, 3]);
    expect(cells[4].covers).toEqual([1, 4]);
    expect(cells[4].value).toBe(15);
  });
});
