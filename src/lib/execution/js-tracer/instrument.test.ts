import { describe, expect, it } from "vitest";

import { instrument } from "./instrument";

/** Run instrumented code with stub hooks and collect the trace it produces. */
function runInstrumented(code: string) {
  const trace: { line: number; depth: number; scope: Record<string, unknown> }[] = [];
  const stack: string[] = ["<module>"];

  const snap = (scope: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(scope)) {
      const v = scope[k];
      out[k] = typeof v === "function" ? "[fn]" : Array.isArray(v) ? v.slice() : v;
    }
    return out;
  };

  const $rx_trace = (line: number, scope: Record<string, unknown>) =>
    trace.push({ line, depth: stack.length, scope: snap(scope) });
  const $rx_enter = (name: string) => stack.push(name);
  const $rx_exit = () => {
    if (stack.length > 1) stack.pop();
  };

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function("$rx_trace", "$rx_enter", "$rx_exit", "console", '"use strict";\n' + code);
  fn($rx_trace, $rx_enter, $rx_exit, console);
  return { trace, finalDepth: stack.length };
}

describe("instrument", () => {
  it("traces straight-line code with growing scope", () => {
    const { code, traced } = instrument("let a = 1;\nlet b = 2;\nlet c = a + b;");
    expect(traced).toBe(true);

    const { trace } = runInstrumented(code);
    expect(trace.map((t) => t.line)).toEqual([1, 2, 3]);
    // Scope only holds names declared before each step (TDZ-safe).
    expect(trace[0].scope).toEqual({});
    expect(trace[1].scope).toEqual({ a: 1 });
    expect(trace[2].scope).toEqual({ a: 1, b: 2 });
  });

  it("re-traces a loop body each iteration and sees mutation", () => {
    const { trace } = runInstrumented(
      instrument("const arr = [3, 1, 2];\nfor (let i = 0; i < arr.length; i++) {\n  arr[i] = arr[i] * 2;\n}").code
    );
    // The body line (3) runs once per element.
    const bodySteps = trace.filter((t) => t.line === 3);
    expect(bodySteps).toHaveLength(3);
    // Last body step sees the first two elements already doubled.
    expect((bodySteps[2].scope.arr as number[])).toEqual([6, 2, 2]);
    expect(bodySteps[2].scope.i).toBe(2);
  });

  it("tracks call frames and parameter scope, then unwinds", () => {
    const { trace, finalDepth } = runInstrumented(
      instrument("function f(n) {\n  return n * 2;\n}\nconst r = f(5);").code
    );
    const inside = trace.find((t) => t.depth === 2);
    expect(inside).toBeDefined();
    expect(inside!.scope.n).toBe(5);
    // Frame is popped again by the end (finally runs $rx_exit).
    expect(finalDepth).toBe(1);
  });

  it("handles recursion (frames nest and unwind)", () => {
    const { trace, finalDepth } = runInstrumented(
      instrument("function fac(n) {\n  if (n <= 1) return 1;\n  return n * fac(n - 1);\n}\nfac(4);").code
    );
    const maxDepth = Math.max(...trace.map((t) => t.depth));
    expect(maxDepth).toBeGreaterThanOrEqual(4); // <module> + fac(4..1)
    expect(finalDepth).toBe(1);
  });

  it("instruments arrow callbacks and captures their params", () => {
    const { trace } = runInstrumented(
      instrument("const xs = [1, 2];\nxs.forEach((x) => {\n  const y = x + 1;\n});").code
    );
    const inCallback = trace.find((t) => t.depth === 2 && "x" in t.scope);
    expect(inCallback).toBeDefined();
  });

  it("falls back (traced=false) on a syntax error, code unchanged", () => {
    const src = "let x = ;";
    const result = instrument(src);
    expect(result.traced).toBe(false);
    expect(result.code).toBe(src);
    expect(result.error).toBeTruthy();
  });
});
