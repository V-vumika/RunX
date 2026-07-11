/**
 * Per-language source-analysis profile.
 *
 * The complexity pipeline (classify.ts → ComplexityPanel) is language-agnostic
 * once it has two things: {@link ComplexityInfo} facts (loop nesting +
 * recursion shape) and a handful of source-level signals (defined function
 * names, idiom checks). This interface is where each language supplies both —
 * the classifier, the space-complexity derivation, and the panel never change.
 *
 * Python's facts come from the tracer itself (the AST pass inside
 * pyodide.worker.js), so its profile has no static analyzer. Languages without
 * a tracer-side pass (JavaScript today; C/C++/Java when Judge0 lands) provide
 * `analyzeComplexity`, a rules-based static scanner run client-side. Per
 * project rule the complexity class is always decided by these rules — never
 * by the LLM.
 */

import type { ComplexityInfo } from "@/types/snapshot";
import type { Language } from "@/lib/execution/entry";

export interface LanguageProfile {
  language: Language;
  /** Summary title for a straight-line program with no loops or recursion. */
  scriptTitle: string;
  /** Names of the functions defined in the source (for name-based signals). */
  definedFunctions(code: string): string[];
  /** Loop-nesting estimate used only when no ComplexityInfo facts exist. */
  fallbackLoopNesting(code: string): number;
  /** Source signal: a min-heap / priority queue is in play (Dijkstra check). */
  usesHeap(code: string): boolean;
  /** Source idiom: halving a range (binary-search signal, paired with `mid`). */
  halvesRange(code: string): boolean;
  /**
   * Static {@link ComplexityInfo} for languages whose tracer doesn't produce
   * it. Null when the tracer provides the facts (Python — see the worker's
   * `__runx_analyze_complexity`).
   */
  analyzeComplexity: ((code: string) => ComplexityInfo | null) | null;
}
