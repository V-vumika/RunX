import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The Pyodide worker embeds its Python tracer inside a JS template literal
 * (`const TRACE_PROGRAM = ` … ` `). A stray backtick or `${` in that Python
 * closes the literal early and breaks the whole worker at load — which shows up
 * only as a runtime "Engine error", never in the TS build. This guards against
 * that class of bug (it bit us once with a backtick in a Python comment).
 */
describe("pyodide worker template literal", () => {
  const src = readFileSync(
    resolve(__dirname, "../../../public/workers/pyodide.worker.js"),
    "utf-8"
  );

  const OPEN = "const TRACE_PROGRAM = `";
  const start = src.indexOf(OPEN) + OPEN.length;
  const end = src.indexOf("`;", start);
  const body = src.slice(start, end);

  it("finds the embedded Python program", () => {
    expect(start).toBeGreaterThan(OPEN.length - 1);
    expect(end).toBeGreaterThan(start);
    expect(body).toContain("__runx_run");
  });

  it("contains no backtick that would close the literal early", () => {
    expect(body.includes("`")).toBe(false);
  });

  it("contains no `${` that JS would treat as interpolation", () => {
    expect(body.includes("${")).toBe(false);
  });
});
