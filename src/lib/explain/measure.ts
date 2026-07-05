/**
 * Empirical run measurement (Phase 3.2).
 *
 * The classifier gives the *theoretical* worst-case class; this counts what the
 * program actually did on this input — a concrete, honest counterpart. We can't
 * fit a growth curve from a single run (that needs multiple input sizes we can't
 * generically synthesize), so we report measured facts, not a guessed Big-O:
 * operations executed, function calls, peak call depth, and the detected input
 * size — plus operations-per-element to make the cost tangible.
 */

import type { Snapshot, ValueNode } from "@/types/snapshot";

export interface RunMeasurement {
  /** Line executions — a direct proxy for "operations performed". */
  steps: number;
  /** Number of function calls. */
  calls: number;
  /** Peak call-stack depth (recursion / nesting). */
  maxDepth: number;
  /** Largest input collection detected at the start (proxy for n), or null. */
  inputSize: number | null;
  /** True if tracing stopped at the step cap (so counts are a lower bound). */
  truncated: boolean;
}

function collectionSize(node: ValueNode): number {
  if (node.length != null) return node.length;
  if (node.items) return node.items.length;
  if (node.entries) return node.entries.length;
  return 0;
}

const SIZED_KINDS = new Set(["list", "tuple", "set", "deque", "dict", "str"]);

export function measureRun(snapshots: Snapshot[], truncated = false): RunMeasurement | null {
  if (snapshots.length === 0) return null;

  let steps = 0;
  let calls = 0;
  let maxDepth = 0;
  for (const s of snapshots) {
    if (s.event === "line") steps++;
    if (s.event === "call") calls++;
    if (s.stack.length > maxDepth) maxDepth = s.stack.length;
  }
  if (steps === 0) steps = snapshots.length; // fallback if events aren't tagged

  // Input size: the largest collection visible in module scope near the start.
  let inputSize: number | null = null;
  for (const s of snapshots.slice(0, 5)) {
    const frame = s.stack[0];
    if (!frame) continue;
    for (const v of frame.locals) {
      if (v.name.startsWith("__")) continue;
      if (SIZED_KINDS.has(v.value.kind)) {
        const n = collectionSize(v.value);
        if (n > (inputSize ?? -1)) inputSize = n;
      }
    }
  }

  return { steps, calls, maxDepth, inputSize, truncated };
}
