/**
 * Language-agnostic "entry point" contract.
 *
 * A pasted program may have no driver code — e.g. a LeetCode-style
 * `class Solution` whose method is never called, so nothing executes and there
 * is nothing to trace. An {@link EntryRunner} detects the callable entry point
 * and lets us synthesize a driver (a call with user-supplied inputs) so the
 * program actually runs.
 *
 * This file is the shared contract. Each language ships one implementation
 * (Python today; JS / Java / C++ later) that produces these same shapes — the
 * visualizers never change, only the per-language detection and code-gen do.
 */

export type Language = "python" | "javascript" | "java" | "cpp";

/** What kind of callable (if any) the user's code exposes. */
export type EntryKind =
  /** Top-level code already runs something — run as-is, no driver needed. */
  | "has-driver"
  /** A class method (e.g. `Solution.twoSum`) that nothing calls. */
  | "class-method"
  /** A top-level function that nothing calls. */
  | "free-function"
  /** Nothing runnable was found. */
  | "none";

/** The callable entry point detected in a program. */
export interface EntryPoint {
  kind: EntryKind;
  /** Class to instantiate, for `class-method`. */
  className?: string;
  /** Function or method name to call. */
  functionName?: string;
  /** Parameter names of the entry point, in order (excludes self/cls). */
  params: string[];
}

/** Input values for an entry point, keyed by parameter name. */
export type Inputs = Record<string, string>;

/**
 * Per-language strategy for turning a bare solution into a runnable program.
 *
 * `buildSource` only ever appends — it never rewrites the user's code, so line
 * numbers in the trace still map to the editor. The call to the entry point is
 * always constructed by the runner (never hand-editable), so it can't be broken;
 * the user only supplies the per-parameter input values.
 */
export interface EntryRunner {
  language: Language;
  /** Inspect source and report its entry point. */
  detectEntry(code: string): EntryPoint;
  /**
   * Append a driver that assigns each parameter from `inputs` and calls the
   * entry point. Returns the code unchanged when no driver is needed.
   */
  buildSource(code: string, entry: EntryPoint, inputs: Inputs): string;
}
