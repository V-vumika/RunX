import { describe, it, expect } from "vitest";
import { preflightCheck } from "./support-check";

describe("preflightCheck", () => {
  it("blocks input() — it would hang on missing stdin", () => {
    const issues = preflightCheck("x = input()\nprint(x)");
    expect(issues.some((i) => i.severity === "block" && /input/i.test(i.title))).toBe(true);
  });

  it("does not trip on input() inside a comment", () => {
    const issues = preflightCheck("# read with input()\nx = 5");
    expect(issues).toHaveLength(0);
  });

  it("warns on networking imports", () => {
    const issues = preflightCheck("import requests\nrequests.get('http://x')");
    expect(issues.some((i) => i.severity === "warn" && /network/i.test(i.title))).toBe(true);
  });

  it("warns on file opening", () => {
    expect(preflightCheck("f = open('a.txt')").some((i) => /file/i.test(i.title))).toBe(true);
  });

  it("warns on async/await", () => {
    expect(preflightCheck("async def main():\n    await go()").some((i) => /async/i.test(i.title))).toBe(true);
  });

  it("passes clean pure-Python code", () => {
    expect(preflightCheck("def f(n):\n    return n * 2\nprint(f(3))")).toHaveLength(0);
  });
});
