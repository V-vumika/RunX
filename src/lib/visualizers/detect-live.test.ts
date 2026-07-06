import { describe, it, expect } from "vitest";
import type { Snapshot, ValueNode } from "@/types/snapshot";
import { detectLiveStructures } from "./detect-live";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const vlist = (items: ValueNode[], id?: number): ValueNode => ({
  kind: "list", pyType: "list", repr: `[${items.map((i) => i.repr).join(", ")}]`, items, id,
});
const vmatrix = (rows: number[][], id?: number): ValueNode =>
  vlist(rows.map((r) => vlist(r.map(vint))), id);
const vdict = (id?: number): ValueNode => ({
  kind: "dict", pyType: "dict", repr: "{'a': 1}", id,
  entries: [{ key: { kind: "str", pyType: "str", repr: "'a'", value: "a" }, value: vint(1) }],
});

const snap = (locals: Record<string, ValueNode>): Snapshot => ({
  step: 0, line: 1, event: "line", stdout: "",
  stack: [{ functionName: "<module>", line: 1, locals: Object.entries(locals).map(([name, value]) => ({ name, value })) }],
});

describe("detectLiveStructures", () => {
  it("finds several structures in one frame", () => {
    // `dp` is a DP-table name → matrix view; a `grid`-named 2-D list would route
    // to the grid view instead (covered in grid.test.ts).
    const s = snap({ nums: vlist([vint(1), vint(2)], 1), dp: vmatrix([[1, 2], [3, 4]], 2), seen: vdict(3), n: vint(5) });
    const views = detectLiveStructures(s, undefined, "").map((x) => x.view).sort();
    expect(views).toEqual(["array", "hashmap", "matrix"]);
  });

  it("routes a set to the set view (not an indexed array)", () => {
    const s = snap({ seen: { kind: "set", pyType: "set", repr: "{1, 2}", id: 1, items: [vint(1), vint(2)] } });
    expect(detectLiveStructures(s, undefined, "")[0].view).toBe("set");
  });

  it("dedupes aliases pointing at the same object", () => {
    const shared = vlist([vint(1)], 42);
    const s = snap({ a: shared, b: shared });
    expect(detectLiveStructures(s, undefined, "")).toHaveLength(1);
  });

  it("promotes a list to a heap only with a heapq source signal + heap-ish name", () => {
    const s = snap({ heap: vlist([vint(1), vint(2)], 1) });
    expect(detectLiveStructures(s, undefined, "")[0].view).toBe("array");
    expect(detectLiveStructures(s, undefined, "import heapq\nheapq.heappush(heap, 1)")[0].view).toBe("heap");
  });

  it("marks changed vs added structures against the previous step", () => {
    const prev = snap({ nums: vlist([vint(1)], 1) });
    const curr = snap({ nums: vlist([vint(1), vint(2)], 1) });
    expect(detectLiveStructures(curr, prev, "")[0].diffState).toBe("changed");
    expect(detectLiveStructures(curr, undefined, "")[0].diffState).toBe("added");
  });

  it("ignores primitives and plain objects", () => {
    const obj: ValueNode = { kind: "object", pyType: "Foo", repr: "<Foo>", attributes: [] };
    expect(detectLiveStructures(snap({ x: vint(1), f: obj }), undefined, "")).toHaveLength(0);
  });
});
