import { describe, it, expect } from "vitest";
import { pythonRunner } from "./python";

const { detectEntry, buildSource } = pythonRunner;

describe("detectEntry", () => {
  it("treats top-level executable code as a self-driving program", () => {
    const code = "def f(n):\n    return n\n\nprint(f(3))";
    expect(detectEntry(code).kind).toBe("has-driver");
  });

  it("detects a LeetCode-style class method and its params (skipping self)", () => {
    const code = "class Solution:\n    def twoSum(self, nums, target):\n        return []";
    const e = detectEntry(code);
    expect(e.kind).toBe("class-method");
    expect(e.className).toBe("Solution");
    expect(e.functionName).toBe("twoSum");
    expect(e.params).toEqual(["nums", "target"]);
  });

  it("skips __init__ and picks the first real method", () => {
    const code = "class Solution:\n    def __init__(self):\n        self.x = 1\n    def reverse(self, x):\n        return x";
    const e = detectEntry(code);
    expect(e.functionName).toBe("reverse");
    expect(e.params).toEqual(["x"]);
  });

  it("detects a bare top-level function", () => {
    const e = detectEntry("def fib(n):\n    return n");
    expect(e.kind).toBe("free-function");
    expect(e.functionName).toBe("fib");
  });

  it("strips type annotations from params", () => {
    const code = "class S:\n    def go(self, nums: list[int], k: int = 0):\n        return k";
    expect(detectEntry(code).params).toEqual(["nums", "k"]);
  });
});

describe("buildSource", () => {
  it("appends a runnable driver that assigns inputs and calls the method", () => {
    const code = "class Solution:\n    def add(self, a, b):\n        return a + b";
    const entry = detectEntry(code);
    const src = buildSource(code, entry, { a: "2", b: "3" });
    expect(src).toContain("a = 2");
    expect(src).toContain("b = 3");
    expect(src).toContain("print(Solution().add(a, b))");
  });

  it("leaves self-driving code untouched", () => {
    const code = "print('hi')";
    expect(buildSource(code, detectEntry(code), {})).toBe(code);
  });
});
