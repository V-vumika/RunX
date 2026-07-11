import { describe, expect, it } from "vitest";

import { javascriptRunner } from "./javascript";

const { detectEntry, buildSource } = javascriptRunner;

describe("javascript entry: detectEntry", () => {
  it("detects the LeetCode `var f = function` template as a free function", () => {
    const entry = detectEntry("var twoSum = function (nums, target) {\n  return [0, 1];\n};");
    expect(entry.kind).toBe("free-function");
    expect(entry.functionName).toBe("twoSum");
    expect(entry.params).toEqual(["nums", "target"]);
  });

  it("detects an arrow assigned to const", () => {
    const entry = detectEntry("const solve = (n) => n * 2;");
    expect(entry.kind).toBe("free-function");
    expect(entry.functionName).toBe("solve");
    expect(entry.params).toEqual(["n"]);
  });

  it("detects a function declaration", () => {
    const entry = detectEntry("function reverse(s) {\n  return s.split('').reverse().join('');\n}");
    expect(entry.kind).toBe("free-function");
    expect(entry.functionName).toBe("reverse");
  });

  it("detects a class method, preferring `Solution`", () => {
    const entry = detectEntry(
      "class Helper {\n  noop() {}\n}\nclass Solution {\n  twoSum(nums, target) {\n    return [];\n  }\n}"
    );
    expect(entry.kind).toBe("class-method");
    expect(entry.className).toBe("Solution");
    expect(entry.functionName).toBe("twoSum");
    expect(entry.params).toEqual(["nums", "target"]);
  });

  it("skips the constructor when choosing a class method", () => {
    const entry = detectEntry("class C {\n  constructor(x) { this.x = x; }\n  run(a) { return a; }\n}");
    expect(entry.kind).toBe("class-method");
    expect(entry.functionName).toBe("run");
    expect(entry.params).toEqual(["a"]);
  });

  it("treats a top-level call as has-driver", () => {
    const entry = detectEntry("function f(a) { return a; }\nconsole.log(f(1));");
    expect(entry.kind).toBe("has-driver");
  });

  it("treats a non-function variable init as has-driver", () => {
    const entry = detectEntry("const nums = [1, 2, 3];\nfunction f(a) { return a; }");
    expect(entry.kind).toBe("has-driver");
  });

  it("runs unparsable code as-is (has-driver) so the worker surfaces the error", () => {
    expect(detectEntry("function f( {").kind).toBe("has-driver");
  });
});

describe("javascript entry: buildSource", () => {
  it("appends a driver for a free function without touching user lines", () => {
    const code = "function add(a, b) {\n  return a + b;\n}";
    const out = buildSource(code, detectEntry(code) as never, { a: "2", b: "3" });
    expect(out.startsWith(code)).toBe(true);
    expect(out).toContain("const a = 2;");
    expect(out).toContain("const b = 3;");
    expect(out).toContain("console.log(add(a, b));");
  });

  it("instantiates the class for a class method", () => {
    const code = "class Solution {\n  twoSum(nums, target) {\n    return [];\n  }\n}";
    const out = buildSource(code, detectEntry(code) as never, { nums: "[2,7,11,15]", target: "9" });
    expect(out).toContain("const nums = [2,7,11,15];");
    expect(out).toContain("console.log(new Solution().twoSum(nums, target));");
  });

  it("leaves has-driver code unchanged", () => {
    const code = "console.log(1 + 1);";
    expect(buildSource(code, { kind: "has-driver", params: [] }, {})).toBe(code);
  });
});
