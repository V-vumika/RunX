/**
 * Enriches raw StackFrame[] data for call-stack narration.
 *
 * The worker already orders frames outermost→innermost. This module adds
 * metadata the step narrator needs without touching the store:
 *   - which frame is "active" (innermost = currently executing)
 *   - whether a function is in a recursive call chain
 *   - the recursion index (1st call / 2nd call / …)
 */

import type { StackFrame, Variable } from "@/types/snapshot";

/** A stack frame with extra display-layer metadata. */
export interface EnrichedFrame {
  /** The original frame from the snapshot. */
  frame: StackFrame;
  /** True for the innermost (currently executing) frame. */
  isActive: boolean;
  /**
   * True when this function name appears more than once in the stack,
   * i.e. the function called itself (directly or indirectly).
   */
  isRecursive: boolean;
  /**
   * When isRecursive: 1-based call number for this occurrence, counting
   * from the first (outermost) call of this function downward.
   * e.g. fib(5)→fib(4)→fib(3) → call indices 1, 2, 3.
   * 0 when not recursive.
   */
  recursionIndex: number;
  /**
   * Number of local variables defined in this frame (excludes __builtins__
   * and other internal names starting with "__").
   */
  localCount: number;
}

function visibleLocals(locals: Variable[]): Variable[] {
  return locals.filter((v) => !v.name.startsWith("__"));
}

/**
 * Enrich a snapshot's call stack for display. Input is outermost-first
 * (as stored in `Snapshot.stack`); output preserves that order.
 *
 * Callers that want innermost-first for display should `.slice().reverse()`.
 */
export function enrichFrames(frames: StackFrame[]): EnrichedFrame[] {
  // Count how many times each function name appears.
  const nameCounts = new Map<string, number>();
  for (const f of frames) {
    nameCounts.set(f.functionName, (nameCounts.get(f.functionName) ?? 0) + 1);
  }

  // Per-name counter used to assign recursionIndex in traversal order.
  const nameSeenSoFar = new Map<string, number>();

  return frames.map((frame, i) => {
    const total = nameCounts.get(frame.functionName) ?? 1;
    const isRecursive = total > 1;

    const seen = nameSeenSoFar.get(frame.functionName) ?? 0;
    nameSeenSoFar.set(frame.functionName, seen + 1);

    return {
      frame,
      isActive: i === frames.length - 1,
      isRecursive,
      recursionIndex: isRecursive ? seen + 1 : 0,
      localCount: visibleLocals(frame.locals).length,
    };
  });
}

/**
 * Human-readable label for a frame.
 * "<module>" → "module scope", everything else → "funcName()".
 */
export function frameLabel(frame: StackFrame): string {
  return frame.functionName === "<module>"
    ? "module scope"
    : `${frame.functionName}()`;
}
