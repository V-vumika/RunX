/**
 * Adaptive recording budget for a run.
 *
 * The worker records up to this many snapshots and then keeps running *without*
 * recording, so the program still finishes and yields a real final state (see
 * the worker's run-to-completion logic). We scale the budget gently with program
 * size so a heavier program captures more of its early steps while a tiny script
 * stays lean.
 *
 * This is NOT a timeout — the client's wall-clock watchdog is. It only bounds
 * how many snapshots are stored (memory + how far you can step through).
 */

export const MIN_STEP_BUDGET = 4000;
export const MAX_STEP_BUDGET = 10000;
/** Extra recorded steps granted per meaningful line of source. */
export const STEPS_PER_LINE = 30;

/** Count non-blank, non-comment source lines — a cheap proxy for program size. */
function meaningfulLines(code: string): number {
  let n = 0;
  for (const raw of code.split("\n")) {
    const t = raw.trim();
    if (t.length > 0 && !t.startsWith("#")) n++;
  }
  return n;
}

/** Snapshot budget for `code`, scaled by size and clamped to a safe range. */
export function stepBudget(code: string): number {
  const budget = MIN_STEP_BUDGET + meaningfulLines(code) * STEPS_PER_LINE;
  return Math.max(MIN_STEP_BUDGET, Math.min(MAX_STEP_BUDGET, budget));
}
