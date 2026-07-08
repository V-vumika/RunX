/**
 * Segment tree detection (Phase 7).
 *
 * A segment tree is a flat, 1-indexed array laid out as an implicit binary tree:
 * node `i` has children `2i` and `2i+1`, the root (index 1) spans the whole
 * range, and each internal node aggregates its two children's range. By shape
 * that's just an int array, so — like Fenwick — we route to the tree view only
 * when the variable is *named* like a segment tree AND the source shows the
 * `2*i` / `i<<1` child-indexing that gives a segment tree away.
 *
 * Ranges are exact for a perfect tree (a power-of-two-sized array, the standard
 * iterative `2n` build): the root covers `[0, n-1]` and each node splits at its
 * midpoint. For other sizes (e.g. a padded `4n` recursive build) we still draw
 * the tree of values but omit ranges rather than guess wrong, and trailing
 * all-zero (unused) subtrees are hidden.
 */

import type { ValueNode } from "@/types/snapshot";

const SEG_NAME = /^(seg|segtree|seg_tree|segment|segment_tree|segtre|st|tree)$/i;

/** Child-indexing idiom of an implicit binary tree: `2*i(+1)`, `i<<1`, or a `mid = (` split. */
const SEG_SIGNAL = /2\s*\*\s*[a-z_]\w*|[a-z_]\w*\s*<<\s*1|\bmid\s*=\s*\(/i;

const isPow2 = (n: number): boolean => n >= 2 && (n & (n - 1)) === 0;

/** True when `node` is a segment-tree array (name + source say so). */
export function isSegmentTree(name: string, node: ValueNode, code: string): boolean {
  if (node.kind !== "list" && node.kind !== "tuple") return false;
  if (!SEG_NAME.test(name)) return false;
  const items = node.items ?? [];
  if (items.length < 4) return false;
  if (!items.every((it) => it.kind === "int" || it.kind === "float")) return false;
  return SEG_SIGNAL.test(code);
}

export interface SegNode {
  index: number;
  value: number;
  level: number;
  /** Inclusive range this node aggregates, or null when the size isn't a perfect tree. */
  covers: [number, number] | null;
  leftIdx?: number;
  rightIdx?: number;
}

export interface SegTree {
  root: SegNode | null;
  /** Rendered nodes (padding / unused subtrees pruned), in build order. */
  nodes: SegNode[];
  /** Number of leaves when the size is a perfect tree, else null. */
  n: number | null;
  /** True when ranges are exact (perfect / power-of-two tree). */
  ranged: boolean;
}

/** Turn the flat array into an implicit binary tree, with ranges when derivable. */
export function buildSegmentTree(node: ValueNode): SegTree {
  const items = node.items ?? [];
  const len = items.length;
  const val = (i: number): number => Number(items[i]?.value ?? 0);

  // Perfect tree ⇔ the array length is a power of two (used indices 1..len-1 = 2n-1 nodes).
  const ranged = isPow2(len);
  const n = ranged ? len / 2 : null;

  // For non-perfect (padded) arrays, prune subtrees that are entirely zero/unused.
  const zeroCache = new Map<number, boolean>();
  const allZero = (i: number): boolean => {
    if (i <= 0 || i >= len) return true;
    const cached = zeroCache.get(i);
    if (cached !== undefined) return cached;
    zeroCache.set(i, true); // cycle guard (implicit trees have none, but be safe)
    const res = val(i) === 0 && allZero(2 * i) && allZero(2 * i + 1);
    zeroCache.set(i, res);
    return res;
  };

  const nodes: SegNode[] = [];
  const build = (i: number, level: number, lo: number, hi: number): SegNode | null => {
    if (i <= 0 || i >= len) return null;
    if (!ranged && allZero(i)) return null;
    const mid = (lo + hi) >> 1;
    const seg: SegNode = {
      index: i,
      value: val(i),
      level,
      covers: ranged ? [lo, hi] : null,
    };
    const L = build(2 * i, level + 1, lo, mid);
    const R = build(2 * i + 1, level + 1, mid + 1, hi);
    if (L) seg.leftIdx = L.index;
    if (R) seg.rightIdx = R.index;
    nodes.push(seg);
    return seg;
  };

  const root = build(1, 0, 0, (n ?? 1) - 1);
  return { root, nodes, n, ranged };
}
