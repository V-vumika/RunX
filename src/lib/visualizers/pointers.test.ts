import { describe, it, expect } from "vitest";
import type { ValueNode, Variable } from "@/types/snapshot";
import { detectPointers } from "./pointers";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const locals = (o: Record<string, ValueNode>): Variable[] =>
  Object.entries(o).map(([name, value]) => ({ name, value }));

describe("detectPointers", () => {
  it("finds left/right pointers and shades the window between them", () => {
    const o = detectPointers(6, locals({ left: vint(1), right: vint(4), target: vint(99) }));
    expect(o.pointers.map((p) => p.name).sort()).toEqual(["left", "right"]);
    expect(o.window).toEqual({ start: 1, end: 4 });
  });

  it("ignores index-ish names whose value is out of range", () => {
    // `k` is a valid name but 50 is not a valid index into a length-6 array.
    const o = detectPointers(6, locals({ i: vint(2), k: vint(50) }));
    expect(o.pointers.map((p) => p.name)).toEqual(["i"]);
    expect(o.window).toBeNull(); // single pointer → no window
  });

  it("ignores non-index variable names even if in range", () => {
    const o = detectPointers(6, locals({ total: vint(3), count: vint(2) }));
    expect(o.pointers).toHaveLength(0);
  });

  it("allows an exclusive end index equal to length", () => {
    const o = detectPointers(4, locals({ i: vint(0), end: vint(4) }));
    expect(o.pointers.map((p) => p.name).sort()).toEqual(["end", "i"]);
  });

  it("returns empty for an empty sequence", () => {
    expect(detectPointers(0, locals({ i: vint(0) }))).toEqual({ pointers: [], window: null });
  });
});
