import { describe, it, expect } from "vitest";
import type { ValueNode } from "@/types/snapshot";
import { isCounter, parseCounter } from "./counter";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const vstr = (s: string): ValueNode => ({ kind: "str", pyType: "str", repr: `'${s}'`, value: s });
const dict = (pairs: [string, number][], pyType = "dict"): ValueNode => ({
  kind: "dict", pyType, repr: "{...}",
  entries: pairs.map(([k, v]) => ({ key: vstr(k), value: vint(v) })),
});

describe("isCounter", () => {
  it("accepts a Counter and tally-named int dicts", () => {
    expect(isCounter("freq", dict([["a", 3], ["b", 1]]))).toBe(true);
    expect(isCounter("d", dict([["a", 3]], "Counter"))).toBe(true);
  });
  it("rejects plain dicts and non-int values", () => {
    expect(isCounter("memo", dict([["a", 3]]))).toBe(false); // not counter-named / Counter
    expect(isCounter("count", { kind: "dict", pyType: "dict", repr: "{}", entries: [{ key: vstr("a"), value: vstr("x") }] })).toBe(false);
  });
});

describe("parseCounter", () => {
  it("sorts entries by count descending", () => {
    expect(parseCounter(dict([["a", 1], ["b", 5], ["c", 3]]))).toEqual([
      { key: "b", count: 5 },
      { key: "c", count: 3 },
      { key: "a", count: 1 },
    ]);
  });
});
