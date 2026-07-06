/**
 * Frequency-counter detection (Phase 7).
 *
 * Counting problems (anagrams, top-k, frequencies) keep a dict of `key -> count`
 * — often a `collections.Counter`. Shown as a plain hash table that's hard to
 * compare; as sorted bars the distribution is obvious. We only route here when
 * every value is an int AND the variable is a Counter or named like a tally.
 */

import type { ValueNode } from "@/types/snapshot";

// Deliberately NOT `seen` — `seen[x] = i` (index tracking, e.g. two-sum) is not a tally.
const COUNTER_NAME = /count|counter|cnt|freq|frequenc|tally|histogram/i;

export interface CountEntry {
  key: string;
  count: number;
}

export function isCounter(name: string, node: ValueNode): boolean {
  if (node.kind !== "dict") return false;
  const entries = node.entries ?? [];
  if (entries.length === 0) return false;
  if (!entries.every((e) => e.value.kind === "int")) return false;
  return node.pyType === "Counter" || COUNTER_NAME.test(name);
}

export function parseCounter(node: ValueNode): CountEntry[] {
  return (node.entries ?? [])
    .map((e) => ({
      key: String(e.key.value ?? e.key.repr ?? "").replace(/^['"]|['"]$/g, ""),
      count: Number(e.value.value),
    }))
    .sort((a, b) => b.count - a.count);
}
