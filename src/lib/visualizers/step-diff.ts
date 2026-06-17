/**
 * Step-diff utility — computes what changed between two snapshots.
 *
 * Used by animated visualizers (Framer Motion, CSS transitions) to decide
 * which boxes/cells to highlight as "just changed". The diff is intentionally
 * shallow: it compares repr strings. This is accurate for all scalar types and
 * "good enough" for containers because any mutation changes the repr.
 *
 * Usage:
 *   const diff = diffFrames(prev?.stack.at(-1), curr?.stack.at(-1));
 *   diff.changed.has("arr")  // → true if arr's repr changed this step
 *   diff.added.has("x")      // → true if x appeared for the first time
 */

import type { StackFrame, Variable } from "@/types/snapshot";

export type ChangeState = "added" | "changed" | "unchanged" | "removed";

export interface VarDiff {
  /** Variables added this step (new name not present in prev frame). */
  added: Set<string>;
  /** Variables whose repr changed vs the previous step. */
  changed: Set<string>;
  /** Variables present in both frames with the same repr. */
  unchanged: Set<string>;
  /** Variables that existed in prev frame but are gone in curr frame. */
  removed: Set<string>;
  /** Quick lookup: state for a given variable name. */
  stateOf: (name: string) => ChangeState | "unknown";
}

function indexByName(locals: Variable[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const v of locals) {
    if (!v.name.startsWith("__")) m.set(v.name, v.value.repr);
  }
  return m;
}

/**
 * Diff the innermost frames of two consecutive snapshots.
 * Pass `null` for `prev` at step 0 — everything is treated as "added".
 */
export function diffFrames(
  prev: StackFrame | null | undefined,
  curr: StackFrame | null | undefined
): VarDiff {
  const prevMap = prev ? indexByName(prev.locals) : new Map<string, string>();
  const currMap = curr ? indexByName(curr.locals) : new Map<string, string>();

  const added = new Set<string>();
  const changed = new Set<string>();
  const unchanged = new Set<string>();
  const removed = new Set<string>();

  for (const [name, repr] of currMap) {
    if (!prevMap.has(name)) {
      added.add(name);
    } else if (prevMap.get(name) !== repr) {
      changed.add(name);
    } else {
      unchanged.add(name);
    }
  }
  for (const name of prevMap.keys()) {
    if (!currMap.has(name)) removed.add(name);
  }

  return {
    added,
    changed,
    unchanged,
    removed,
    stateOf: (name) => {
      if (added.has(name)) return "added";
      if (changed.has(name)) return "changed";
      if (unchanged.has(name)) return "unchanged";
      if (removed.has(name)) return "removed";
      return "unknown";
    },
  };
}

/**
 * Tailwind class for a change-state highlight ring.
 * Returns empty string for "unchanged" and "unknown".
 */
export function diffRingClass(state: ChangeState | "unknown"): string {
  switch (state) {
    case "added":   return "ring-2 ring-emerald-400";
    case "changed": return "ring-2 ring-amber-400";
    case "removed": return "opacity-40";
    default:        return "";
  }
}
