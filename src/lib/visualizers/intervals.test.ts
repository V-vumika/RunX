import { describe, it, expect } from "vitest";
import type { ValueNode } from "@/types/snapshot";
import { isIntervals, parseIntervals } from "./intervals";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const pair = (a: number, b: number): ValueNode => ({ kind: "list", pyType: "list", repr: `[${a}, ${b}]`, items: [vint(a), vint(b)] });
const list = (ps: [number, number][]): ValueNode => ({
  kind: "list", pyType: "list", repr: "[...]", items: ps.map(([a, b]) => pair(a, b)),
});

describe("isIntervals", () => {
  it("accepts a named list of [start, end] pairs", () => {
    expect(isIntervals("intervals", list([[1, 3], [2, 6], [8, 10]]))).toBe(true);
    expect(isIntervals("meetings", list([[0, 30], [5, 10]]))).toBe(true);
  });
  it("rejects unnamed 2-D lists (stays a DP table) and non-pairs", () => {
    expect(isIntervals("dp", list([[1, 3], [2, 6]]))).toBe(false);
    expect(isIntervals("intervals", { kind: "list", pyType: "list", repr: "[[1,2,3]]", items: [{ kind: "list", pyType: "list", repr: "[1,2,3]", items: [vint(1), vint(2), vint(3)] }] })).toBe(false);
  });
});

describe("parseIntervals", () => {
  it("extracts start/end pairs", () => {
    expect(parseIntervals(list([[1, 3], [8, 10]]))).toEqual([
      { start: 1, end: 3 },
      { start: 8, end: 10 },
    ]);
  });
});
