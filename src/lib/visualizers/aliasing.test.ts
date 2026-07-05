import { describe, it, expect } from "vitest";
import type { ValueNode, Variable } from "@/types/snapshot";
import { buildAliasMap, collectSharedRefs } from "./aliasing";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const vlist = (id: number, ns: number[]): ValueNode => ({
  kind: "list", pyType: "list", repr: `[${ns.join(", ")}]`, id, items: ns.map(vint),
});
const locals = (o: Record<string, ValueNode>): Variable[] =>
  Object.entries(o).map(([name, value]) => ({ name, value }));

describe("aliasing", () => {
  it("detects two names sharing one list (a = b = [])", () => {
    const shared = vlist(7, [1, 2, 3]);
    const refs = collectSharedRefs(locals({ a: shared, b: shared }), buildAliasMap(locals({ a: shared, b: shared })));
    expect(refs).toHaveLength(1);
    expect(refs[0].paths.sort()).toEqual(["a", "b"]);
    expect(refs[0].refCount).toBe(2);
  });

  it("detects a nested shared row (grid = [row, row])", () => {
    const row = vlist(9, [0, 0]);
    const grid: ValueNode = { kind: "list", pyType: "list", repr: "[[0,0],[0,0]]", id: 5, items: [row, row] };
    const vars = locals({ grid });
    const refs = collectSharedRefs(vars, buildAliasMap(vars));
    expect(refs).toHaveLength(1);
    expect(refs[0].paths.sort()).toEqual(["grid[0]", "grid[1]"]);
  });

  it("reports nothing when there's no sharing", () => {
    const vars = locals({ a: vlist(1, [1]), b: vlist(2, [2]) });
    expect(buildAliasMap(vars).byId.size).toBe(0);
    expect(collectSharedRefs(vars, buildAliasMap(vars))).toEqual([]);
  });

  it("ignores primitives that share an id (interning)", () => {
    const n = vint(256);
    const vars = locals({ x: n, y: n });
    expect(buildAliasMap(vars).byId.size).toBe(0);
  });
});
