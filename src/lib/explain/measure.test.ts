import { describe, it, expect } from "vitest";
import type { Snapshot, StackFrame, ValueNode } from "@/types/snapshot";
import { measureRun } from "./measure";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const vlist = (len: number): ValueNode => ({
  kind: "list", pyType: "list", repr: "[...]", length: len,
  items: Array.from({ length: len }, (_, i) => vint(i)),
});

const frame = (fn: string, locals: Record<string, ValueNode> = {}): StackFrame => ({
  functionName: fn, line: 1, locals: Object.entries(locals).map(([name, value]) => ({ name, value })),
});
const snap = (event: Snapshot["event"], stack: StackFrame[]): Snapshot => ({
  step: 0, line: 1, event, stdout: "", stack,
});

describe("measureRun", () => {
  it("counts line ops, calls, and peak depth", () => {
    const m = measureRun([
      snap("line", [frame("<module>")]),
      snap("call", [frame("<module>"), frame("f")]),
      snap("line", [frame("<module>"), frame("f")]),
      snap("return", [frame("<module>"), frame("f")]),
      snap("line", [frame("<module>")]),
    ])!;
    expect(m.steps).toBe(3);
    expect(m.calls).toBe(1);
    expect(m.maxDepth).toBe(2);
  });

  it("detects input size from the largest module-scope collection", () => {
    const m = measureRun([snap("line", [frame("<module>", { nums: vlist(7), k: vint(2) })])])!;
    expect(m.inputSize).toBe(7);
  });

  it("returns null for an empty trace", () => {
    expect(measureRun([])).toBeNull();
  });
});
