import { describe, it, expect } from "vitest";
import type { Snapshot } from "@/types/snapshot";

import { analyzeJsComplexity, definedJsFunctions, sanitize } from "./javascript";
import { hasComplexityAnalysis, staticComplexity } from "./index";
import { classifyProgram } from "@/lib/explain/classify";

/** The single synthetic snapshot the JS worker emits (no per-line tracer yet). */
const finalSnap: Snapshot = {
  step: 0,
  line: 0,
  event: "line",
  stack: [{ functionName: "<module>", line: 0, locals: [] }],
  stdout: "",
  final: true,
};

describe("sanitize", () => {
  it("blanks comments and string contents but keeps structure", () => {
    const src = 'const s = "for (x of y) {"; // while (true)\n/* do { } */ let n = 1;';
    const out = sanitize(src);
    expect(out).toHaveLength(src.length);
    expect(out).not.toMatch(/for|while|do/);
    expect(out).toContain("const s =");
    expect(out).toContain("let n = 1;");
  });
});

describe("analyzeJsComplexity — loop nesting", () => {
  it("counts a single scaling loop", () => {
    expect(analyzeJsComplexity("for (const x of arr) total += x;").maxLoopDepth).toBe(1);
    expect(analyzeJsComplexity("while (i < n) { i++; }").maxLoopDepth).toBe(1);
  });

  it("counts nested loops", () => {
    const code =
      "for (let i = 0; i < a.length; i++) {\n" +
      "  for (let j = 0; j < a.length - 1; j++) {\n" +
      "    if (a[j] > a[j + 1]) swap(a, j, j + 1);\n" +
      "  }\n" +
      "}";
    expect(analyzeJsComplexity(code).maxLoopDepth).toBe(2);
  });

  it("nests braceless loop chains", () => {
    expect(
      analyzeJsComplexity("for (const a of xs) for (const b of ys) use(a, b);").maxLoopDepth
    ).toBe(2);
  });

  it("does not let a braceless loop leak past its statement", () => {
    const code = "for (const a of xs) use(a);\nfor (const b of ys) use(b);";
    expect(analyzeJsComplexity(code).maxLoopDepth).toBe(1);
  });

  it("ignores constant-bound for loops (they add O(1))", () => {
    expect(analyzeJsComplexity("for (let i = 0; i < 10; i++) f(i);").maxLoopDepth).toBe(0);
    expect(analyzeJsComplexity("for (const d of [1, 2, 3]) f(d);").maxLoopDepth).toBe(0);
  });

  it("still counts a variable-bound classic for", () => {
    expect(analyzeJsComplexity("for (let i = 0; i < n; i++) f(i);").maxLoopDepth).toBe(1);
    expect(analyzeJsComplexity("for (let i = n; i > 0; i--) f(i);").maxLoopDepth).toBe(1);
  });

  it("counts a do…while once", () => {
    expect(analyzeJsComplexity("do { i++; } while (i < n);").maxLoopDepth).toBe(1);
  });

  it("ignores loop keywords inside strings and comments", () => {
    const code = 'const s = "for while do";\n// for (const x of y) {}\nconsole.log(s);';
    expect(analyzeJsComplexity(code).maxLoopDepth).toBe(0);
  });
});

describe("analyzeJsComplexity — recursion", () => {
  it("detects a decrementing self-call (factorial)", () => {
    const code =
      "function fact(n) {\n  if (n <= 1) return 1;\n  return n * fact(n - 1);\n}";
    expect(analyzeJsComplexity(code).recursion).toEqual([
      { name: "fact", selfCalls: 1, shrink: "decrement" },
    ]);
  });

  it("detects branching recursion (fibonacci)", () => {
    const code =
      "function fib(n) {\n  if (n < 2) return n;\n  return fib(n - 1) + fib(n - 2);\n}";
    const rec = analyzeJsComplexity(code).recursion;
    expect(rec).toHaveLength(1);
    expect(rec[0].selfCalls).toBe(2);
    expect(rec[0].shrink).toBe("decrement");
  });

  it("detects halving recursion via mid", () => {
    const code =
      "function bs(a, t, lo, hi) {\n" +
      "  if (lo > hi) return -1;\n" +
      "  const mid = Math.floor((lo + hi) / 2);\n" +
      "  if (a[mid] === t) return mid;\n" +
      "  if (a[mid] < t) return bs(a, t, mid + 1, hi);\n" +
      "  return bs(a, t, lo, mid - 1);\n" +
      "}";
    const rec = analyzeJsComplexity(code).recursion;
    expect(rec[0].shrink).toBe("half");
  });

  it("detects recursion in arrow functions with expression bodies", () => {
    const code = "const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));";
    expect(analyzeJsComplexity(code).recursion).toEqual([
      { name: "fact", selfCalls: 1, shrink: "decrement" },
    ]);
  });

  it("detects recursion in class methods", () => {
    const code =
      "class Tree {\n  insert(node, val) {\n    if (!node) return make(val);\n    return this.insert(node.left, val);\n  }\n}";
    const rec = analyzeJsComplexity(code).recursion;
    expect(rec.map((r) => r.name)).toContain("insert");
  });

  it("reports nothing for non-recursive functions", () => {
    const code = "function add(a, b) { return a + b; }\nconst mul = (a, b) => a * b;";
    expect(analyzeJsComplexity(code).recursion).toEqual([]);
  });
});

describe("definedJsFunctions", () => {
  it("finds declarations, function expressions, arrows, and methods", () => {
    const code =
      "function bubbleSort(a) { return a; }\n" +
      "const search = (a, t) => a.indexOf(t);\n" +
      "let helper = function (x) { return x; };\n" +
      "class Solution { twoSum(nums, target) { return []; } }";
    expect(definedJsFunctions(code)).toEqual(
      expect.arrayContaining(["bubbleSort", "search", "helper", "twoSum"])
    );
  });

  it("does not mistake control flow for methods", () => {
    const code = "if (x) { y(); }\nwhile (a) { b(); }\nswitch (k) { default: break; }";
    expect(definedJsFunctions(code)).toEqual([]);
  });
});

describe("registry", () => {
  it("has analysis for python and javascript, not for java/cpp yet", () => {
    expect(hasComplexityAnalysis("python")).toBe(true);
    expect(hasComplexityAnalysis("javascript")).toBe(true);
    expect(hasComplexityAnalysis("java")).toBe(false);
    expect(hasComplexityAnalysis("cpp")).toBe(false);
  });

  it("staticComplexity fills in for JS and defers to the tracer for Python", () => {
    expect(staticComplexity("javascript", "while (i < n) i++;")).toEqual({
      maxLoopDepth: 1,
      recursion: [],
    });
    expect(staticComplexity("python", "while i < n:\n    i += 1")).toBeNull();
  });
});

describe("classifyProgram — javascript", () => {
  const classify = (code: string) =>
    classifyProgram(code, [finalSnap], analyzeJsComplexity(code), "javascript");

  it("classifies a nested-loop sort by name as O(n²)", () => {
    const code =
      "function bubbleSort(a) {\n" +
      "  for (let i = 0; i < a.length; i++) {\n" +
      "    for (let j = 0; j < a.length - 1 - i; j++) {\n" +
      "      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];\n" +
      "    }\n" +
      "  }\n" +
      "}";
    const s = classify(code);
    expect(s.kind).toBe("sort");
    expect(s.complexity).toBe("O(n²)");
  });

  it("classifies iterative binary search as O(log n)", () => {
    const code =
      "function binarySearch(a, t) {\n" +
      "  let lo = 0, hi = a.length - 1;\n" +
      "  while (lo <= hi) {\n" +
      "    const mid = Math.floor((lo + hi) / 2);\n" +
      "    if (a[mid] === t) return mid;\n" +
      "    if (a[mid] < t) lo = mid + 1; else hi = mid - 1;\n" +
      "  }\n" +
      "  return -1;\n" +
      "}";
    const s = classify(code);
    expect(s.kind).toBe("binary-search");
    expect(s.complexity).toBe("O(log n)");
  });

  it("classifies branching recursion as O(2ⁿ)", () => {
    const code =
      "function fib(n) {\n  if (n < 2) return n;\n  return fib(n - 1) + fib(n - 2);\n}";
    const s = classify(code);
    expect(s.kind).toBe("recursion");
    expect(s.complexity).toBe("O(2ⁿ)");
  });

  it("classifies a single pass as iterative O(n)", () => {
    const code = "let total = 0;\nfor (const x of nums) total += x;";
    const s = classify(code);
    expect(s.kind).toBe("iterative");
    expect(s.complexity).toBe("O(n)");
  });

  it("labels a straight-line program as a JavaScript program, O(1)", () => {
    const code = "const x = 1;\nconst y = 2;\nconsole.log(x + y);";
    const s = classify(code);
    expect(s.kind).toBe("script");
    expect(s.title).toBe("JavaScript program");
    expect(s.complexity).toBe("O(1)");
  });
});
