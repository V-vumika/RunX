/**
 * Language-profile registry for the complexity/classification pipeline.
 *
 * One {@link LanguageProfile} per analyzable language. classify.ts pulls its
 * source-level signals from here, and the store fills in `RunResult.complexity`
 * via {@link staticComplexity} when a language's tracer doesn't produce the
 * facts itself (JavaScript today). Adding a language to the Complexity tab =
 * one new profile file registered here — no classifier, store, or UI change.
 */

import type { ComplexityInfo } from "@/types/snapshot";
import type { Language } from "@/lib/execution/entry";
import type { LanguageProfile } from "./types";
import { pythonProfile } from "./python";
import { javascriptProfile } from "./javascript";

const PROFILES: Partial<Record<Language, LanguageProfile>> = {
  python: pythonProfile,
  javascript: javascriptProfile,
};

/**
 * The profile for a language. Falls back to Python for languages without one
 * — callers should gate on {@link hasComplexityAnalysis} first; the fallback
 * only preserves the old behavior for any unguarded path.
 */
export function profileFor(language: Language): LanguageProfile {
  return PROFILES[language] ?? pythonProfile;
}

/** True when the Complexity tab has something honest to say for a language. */
export function hasComplexityAnalysis(language: Language): boolean {
  return PROFILES[language] != null;
}

/**
 * Static ComplexityInfo for languages whose tracer doesn't emit it, or null
 * when the tracer provides the facts (Python) or no analyzer exists yet.
 */
export function staticComplexity(language: Language, code: string): ComplexityInfo | null {
  return PROFILES[language]?.analyzeComplexity?.(code) ?? null;
}

export type { LanguageProfile } from "./types";
