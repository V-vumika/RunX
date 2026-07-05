import { describe, it, expect } from "vitest";
import type { ValueNode } from "@/types/snapshot";
import { evaluateLine } from "./expr";

const vint = (n: number): ValueNode => ({ kind: "int", pyType: "int", repr: String(n), value: n });
const vstr = (s: string): ValueNode => ({ kind: "str", pyType: "str", repr: `'${s}'`, value: s });
const vlist = (ns: number[]): ValueNode => ({
  kind: "list", pyType: "list", repr: `[${ns.join(", ")}]`, items: ns.map(vint),
});
const scope = (o: Record<string, ValueNode>) => new Map(Object.entries(o));

/** helper: get the resolved value of a specific sub-expression text. */
function val(subs: { name: string; repr: string }[], text: string): string | undefined {
  return subs.find((s) => s.name === text)?.repr;
}

describe("evaluateLine — substitution", () => {
  it("resolves indexing and arithmetic on an assignment RHS", () => {
    const subs = evaluateLine("arr[i] = min(arr[i], arr[i-1] + 1)", scope({ arr: vlist([1, 2, 3]), i: vint(2) }));
    expect(val(subs, "arr[i]")).toBe("3");
    expect(val(subs, "arr[i-1]")).toBe("2");
    expect(val(subs, "arr[i-1] + 1")).toBe("3");
    expect(val(subs, "min(arr[i], arr[i-1] + 1)")).toBe("3");
  });

  it("resolves a comparison in a condition", () => {
    const subs = evaluateLine("if nums[mid] < target:", scope({ nums: vlist([1, 3, 5, 7]), mid: vint(1), target: vint(5) }));
    expect(val(subs, "nums[mid]")).toBe("3");
    expect(val(subs, "nums[mid] < target")).toBe("True");
  });

  it("resolves len() and two-pointer sum", () => {
    const subs = evaluateLine("s = nums[left] + nums[right]", scope({ nums: vlist([2, 7, 11]), left: vint(0), right: vint(2) }));
    expect(val(subs, "nums[left]")).toBe("2");
    expect(val(subs, "nums[right]")).toBe("11");
    expect(val(subs, "nums[left] + nums[right]")).toBe("13");
  });

  it("indexes strings and compares characters", () => {
    const subs = evaluateLine("if s[left] != s[right]:", scope({ s: vstr("racecar"), left: vint(0), right: vint(6) }));
    expect(val(subs, "s[left]")).toBe("'r'");
    expect(val(subs, "s[left] != s[right]")).toBe("False");
  });

  it("handles negative indexing", () => {
    const subs = evaluateLine("return arr[-1]", scope({ arr: vlist([10, 20, 30]) }));
    expect(val(subs, "arr[-1]")).toBe("30");
  });

  it("resolves the element of a list comprehension per iteration", () => {
    const subs = evaluateLine("squares = [x*x for x in nums]", scope({ nums: vlist([1, 2, 3]), x: vint(3) }));
    expect(val(subs, "x")).toBe("3");
    expect(val(subs, "x*x")).toBe("9");
  });

  it("resolves the value part of a dict comprehension", () => {
    const subs = evaluateLine("d = {k: k+1 for k in nums}", scope({ nums: vlist([1, 2]), k: vint(2) }));
    expect(val(subs, "k+1")).toBe("3");
  });

  it("returns nothing on unresolvable input instead of throwing", () => {
    expect(evaluateLine("result = solve(board)", scope({}))).toEqual([]);
    expect(evaluateLine("x = weird$$syntax", scope({}))).toEqual([]);
  });
});
