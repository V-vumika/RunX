/**
 * Fenwick tree / Binary Indexed Tree detection (Phase 7).
 *
 * A Fenwick tree is a flat 1-indexed int array where each slot `i` stores a
 * partial sum over the range `[i - lowbit(i) + 1 .. i]`, with
 * `lowbit(i) = i & (-i)`. It looks exactly like a plain array, so a bare
 * ArrayView can't convey the thing that makes it a Fenwick tree — which range
 * each cell covers. We route to the Fenwick view only when the array is named
 * like a BIT **and** the source uses the tell-tale lowbit trick (`i & -i`), so
 * we never hijack an ordinary list that happens to be called `tree`.
 */

import type { ValueNode } from "@/types/snapshot";

const FENWICK_NAME = /^(bit|fen|fenwick|fenwick_tree|ftree|bitree|tree)$/i;

/** The lowbit idiom `i & -i` (or `i & (-i)`) — the signature of a Fenwick tree. */
const LOWBIT_SIGNAL = /&\s*-\w|&\s*\(\s*-|lowbit|low_bit/;

/** True when `node` is an int array whose name + source say "Fenwick tree". */
export function isFenwick(name: string, node: ValueNode, code: string): boolean {
  if (node.kind !== "list" && node.kind !== "tuple") return false;
  if (!FENWICK_NAME.test(name)) return false;
  const items = node.items ?? [];
  if (items.length < 3) return false;
  if (!items.every((it) => it.kind === "int" || it.kind === "float")) return false;
  return LOWBIT_SIGNAL.test(code);
}

export interface FenwickCell {
  index: number;
  value: number;
  /** Inclusive 1-based range this cell aggregates, or null for the dummy slot 0. */
  covers: [number, number] | null;
}

/** Compute each slot's value and the index range it aggregates. */
export function buildFenwick(node: ValueNode): FenwickCell[] {
  const items = node.items ?? [];
  return items.map((it, i) => {
    const value = Number(it.value ?? 0);
    if (i === 0) return { index: 0, value, covers: null };
    const low = i & -i;
    return { index: i, value, covers: [i - low + 1, i] as [number, number] };
  });
}
