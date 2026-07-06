/**
 * Interval detection (Phase 7).
 *
 * Merge-intervals / meeting-rooms problems hold a list of `[start, end]` pairs.
 * By shape that's a 2-column matrix, so we only route to the timeline view when
 * the variable is *named* like intervals — otherwise it stays a DP table.
 */

import type { ValueNode } from "@/types/snapshot";

const INTERVAL_NAME = /^(intervals?|meetings?|ranges?|segments?|slots?|bookings?|events?|times?)$/i;

export interface Interval {
  start: number;
  end: number;
}

function isPair(node: ValueNode): boolean {
  if (node.kind !== "list" && node.kind !== "tuple") return false;
  const it = node.items ?? [];
  return it.length === 2 && it.every((x) => x.kind === "int" || x.kind === "float");
}

export function isIntervals(name: string, node: ValueNode): boolean {
  if (node.kind !== "list" && node.kind !== "tuple") return false;
  if (!INTERVAL_NAME.test(name)) return false;
  const items = node.items ?? [];
  return items.length >= 1 && items.every(isPair);
}

export function parseIntervals(node: ValueNode): Interval[] {
  return (node.items ?? []).map((it) => ({
    start: Number(it.items?.[0]?.value ?? 0),
    end: Number(it.items?.[1]?.value ?? 0),
  }));
}
