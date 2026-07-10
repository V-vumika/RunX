import type { RunResult } from "@/types/snapshot";
import type { Language } from "@/lib/execution/entry";
import {
  getPyodideClient,
  type EngineStatus,
  type RunOptions,
} from "@/lib/execution/pyodide-client";
import { getJsClient } from "@/lib/execution/js-client";

/**
 * Execution-provider registry — the one seam between "a language" and "the
 * engine that runs it". The store never talks to a concrete client; it asks
 * for the current language's {@link ExecutionClient} here.
 *
 *   python      → Pyodide in a Web Worker   (pyodide-client.ts)
 *   javascript  → plain Web Worker          (js-client.ts)
 *   java / cpp  → future: Judge0 CE client (self-hosted sandbox) registers
 *                 here with the same interface — no store/UI change needed.
 */

/** What every language engine must expose (both clients satisfy this shape). */
export interface ExecutionClient {
  getStatus(): EngineStatus;
  /** Subscribe to engine status changes; fires immediately, returns unsubscribe. */
  subscribe(listener: (status: EngineStatus, error?: string) => void): () => void;
  /** Begin loading the engine. Safe to call repeatedly. */
  init(): void;
  /** Run source and resolve with the captured {@link RunResult}. */
  run(code: string, options?: RunOptions): Promise<RunResult>;
  /** Tear the engine down. */
  terminate(): void;
}

/** Languages that can actually execute today (the selector disables the rest). */
export const RUNNABLE_LANGUAGES: ReadonlySet<Language> = new Set([
  "python",
  "javascript",
]);

/** The execution client for a language, or undefined if none is wired yet. */
export function getExecutionClient(language: Language): ExecutionClient | undefined {
  switch (language) {
    case "python":
      return getPyodideClient();
    case "javascript":
      return getJsClient();
    default:
      return undefined; // java / cpp — Judge0 later
  }
}

export type { EngineStatus, RunOptions };
