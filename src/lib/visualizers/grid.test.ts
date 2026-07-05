import { describe, it, expect } from "vitest";
import type { ValueNode, Variable } from "@/types/snapshot";
import { detectGrid, isGridName } from "./grid";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const vbool = (b: boolean): ValueNode => ({ kind: "bool", pyType: "bool", repr: b ? "True" : "False", value: b });
const row = (vals: ValueNode[]): ValueNode => ({ kind: "list", pyType: "list", repr: "[...]", items: vals });
const grid2d = (m: number[][]): ValueNode => row(m.map((r) => row(r.map(vint))));
const boolGrid = (m: boolean[][]): ValueNode => row(m.map((r) => row(r.map(vbool))));
const tupleSet = (coords: [number, number][]): ValueNode => ({
  kind: "set", pyType: "set", repr: "{...}",
  items: coords.map(([r, c]) => ({ kind: "tuple", pyType: "tuple", repr: `(${r}, ${c})`, items: [vint(r), vint(c)] })),
});
const locals = (o: Record<string, ValueNode>): Variable[] =>
  Object.entries(o).map(([name, value]) => ({ name, value }));

describe("isGridName", () => {
  it("matches grid-ish names, not dp/memo", () => {
    expect(isGridName("grid")).toBe(true);
    expect(isGridName("board")).toBe(true);
    expect(isGridName("dp")).toBe(false);
    expect(isGridName("memo")).toBe(false);
  });
});

describe("detectGrid", () => {
  it("reads the current (row, col) cursor", () => {
    const g = detectGrid(grid2d([[1, 0], [0, 1]]), locals({ r: vint(1), c: vint(0) }));
    expect(g.current).toEqual({ r: 1, c: 0 });
    expect(g.rows).toBe(2);
    expect(g.cols).toBe(2);
  });

  it("collects visited cells from a set of coord tuples", () => {
    const g = detectGrid(grid2d([[1, 1], [1, 1]]), locals({ visited: tupleSet([[0, 0], [1, 1]]) }));
    expect([...g.visited].sort()).toEqual(["0,0", "1,1"]);
  });

  it("collects visited cells from a 2-D boolean grid", () => {
    const g = detectGrid(
      grid2d([[1, 1], [1, 1]]),
      locals({ seen: boolGrid([[true, false], [false, true]]) })
    );
    expect([...g.visited].sort()).toEqual(["0,0", "1,1"]);
  });

  it("has no cursor when row/col vars aren't in range", () => {
    const g = detectGrid(grid2d([[1]]), locals({ r: vint(9), c: vint(9) }));
    expect(g.current).toBeNull();
  });
});
