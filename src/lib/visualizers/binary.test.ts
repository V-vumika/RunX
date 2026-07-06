import { describe, it, expect } from "vitest";
import type { ValueNode } from "@/types/snapshot";
import { isBitVar, hasBitOps, toBits } from "./binary";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });

describe("isBitVar", () => {
  const code = "mask = 0\nfor i in range(n):\n    mask |= (1 << i)";
  it("accepts a mask-named int when the code uses bit ops", () => {
    expect(isBitVar("mask", vint(5), code)).toBe(true);
    expect(isBitVar("subset", vint(3), code)).toBe(true);
  });
  it("rejects ordinary ints and code without bit ops", () => {
    expect(isBitVar("total", vint(5), code)).toBe(false); // wrong name
    expect(isBitVar("mask", vint(5), "mask = a + b")).toBe(false); // no bit ops
  });
});

describe("hasBitOps", () => {
  it("detects bitwise symbols", () => {
    expect(hasBitOps("x << 1")).toBe(true);
    expect(hasBitOps("x ^ y")).toBe(true);
    expect(hasBitOps("x + y")).toBe(false);
  });
});

describe("toBits", () => {
  it("renders bits MSB-first, min width 8", () => {
    const bits = toBits(5); // 00000101
    expect(bits).toHaveLength(8);
    expect(bits[0]).toEqual({ index: 7, set: false });
    expect(bits.filter((b) => b.set).map((b) => b.index).sort()).toEqual([0, 2]);
  });
  it("widens for values beyond 8 bits", () => {
    expect(toBits(256)).toHaveLength(9); // needs bit 8
  });
});
