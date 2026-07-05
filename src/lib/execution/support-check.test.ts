import { describe, it, expect } from "vitest";
import { preflightCheck, usesStdin } from "./support-check";

describe("preflightCheck", () => {
  it("no longer blocks input() — stdin is supported now", () => {
    expect(preflightCheck("x = input()\nprint(x)")).toHaveLength(0);
  });

  it("does not trip on a warn rule inside a comment", () => {
    const issues = preflightCheck("# uses requests\nx = 5");
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

describe("usesStdin", () => {
  it("detects input() and sys.stdin", () => {
    expect(usesStdin("n = int(input())")).toBe(true);
    expect(usesStdin("import sys\ndata = sys.stdin.read()")).toBe(true);
  });
  it("is false for code that doesn't read input", () => {
    expect(usesStdin("print('hi')")).toBe(false);
  });
});
