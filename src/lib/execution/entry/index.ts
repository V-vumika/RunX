/**
 * Entry-runner registry. Looks up the per-language {@link EntryRunner} that
 * turns bare solutions into runnable programs. Only Python exists today; JS /
 * Java / C++ register here as their tracers land (Phase 9).
 */

import type { EntryRunner, Language } from "./types";
import { pythonRunner } from "./python";

const runners: Partial<Record<Language, EntryRunner>> = {
  python: pythonRunner,
};

/** The entry runner for a language, or undefined if none is registered yet. */
export function getEntryRunner(language: Language): EntryRunner | undefined {
  return runners[language];
}

export type { EntryPoint, EntryRunner, Inputs, Language } from "./types";
