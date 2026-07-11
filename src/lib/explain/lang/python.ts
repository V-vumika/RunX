/**
 * Python {@link LanguageProfile}.
 *
 * Python's ComplexityInfo facts are computed by the tracer itself — the AST
 * pass (`__runx_analyze_complexity`) inside public/workers/pyodide.worker.js —
 * so `analyzeComplexity` is null here. The source-signal helpers below were
 * moved verbatim from classify.ts when the classifier went multi-language;
 * their behavior is unchanged.
 */

import type { LanguageProfile } from "./types";

/** Max simultaneously-open *loop* headers by indentation — a rough fallback
 *  used only when the tracer's AST facts are unavailable (unparsable source). */
function maxLoopNesting(code: string): number {
  const stack: { indent: number; loop: boolean }[] = [];
  let max = 0;
  for (const raw of code.split("\n")) {
    const line = raw.replace(/\t/g, "    ");
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (trimmed.endsWith(":")) stack.push({ indent, loop: /^(for|while)\b/.test(trimmed) });
    const depth = stack.filter((s) => s.loop).length;
    if (depth > max) max = depth;
  }
  return max;
}

function definedFunctions(code: string): string[] {
  const names: string[] = [];
  for (const m of code.matchAll(/^\s*def\s+([A-Za-z_]\w*)\s*\(/gm)) names.push(m[1]);
  return names;
}

export const pythonProfile: LanguageProfile = {
  language: "python",
  scriptTitle: "Python script",
  definedFunctions,
  fallbackLoopNesting: maxLoopNesting,
  usesHeap: (code) => /\bheapq\b|\bheappush\b|\bheappop\b/.test(code),
  // Floor division by 2 — the Python way to compute a midpoint.
  halvesRange: (code) => /\/\/\s*2/.test(code),
  analyzeComplexity: null, // the tracer's AST pass supplies the facts
};
