/**
 * Union-Find / Disjoint-Set-Union detection (Phase 7).
 *
 * DSU is almost always a `parent` array where `parent[i]` is the index of i's
 * parent (a self-index). We detect that shape by name + values, then follow the
 * parents to fixpoint to group elements into connected components — the thing a
 * plain array view can't show.
 */

import type { ValueNode } from "@/types/snapshot";

const UF_NAME = /^(parent|parents|par|root|roots|uf|dsu|leader|comp|component|group|ds)$/i;

/** True when `node` is a self-indexing int array with a DSU-ish name. */
export function isUnionFind(name: string, node: ValueNode): boolean {
  if (node.kind !== "list" && node.kind !== "tuple") return false;
  if (!UF_NAME.test(name)) return false;
  const items = node.items ?? [];
  if (items.length < 2) return false;
  return items.every((it) => {
    if (it.kind !== "int") return false;
    const v = Number(it.value);
    return Number.isInteger(v) && v >= 0 && v < items.length;
  });
}

export interface UFComponent {
  root: number;
  members: number[];
}

/** Group elements into components by following parent pointers to their root. */
export function buildForest(node: ValueNode): { parent: number[]; components: UFComponent[] } {
  const parent = (node.items ?? []).map((it) => Number(it.value));
  const n = parent.length;

  const find = (i: number): number => {
    const seen = new Set<number>();
    let cur = i;
    while (parent[cur] !== cur && !seen.has(cur)) {
      seen.add(cur);
      cur = parent[cur];
    }
    return cur;
  };

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    const arr = groups.get(r) ?? [];
    arr.push(i);
    groups.set(r, arr);
  }

  const components: UFComponent[] = [...groups.entries()]
    .map(([root, members]) => ({ root, members }))
    .sort((a, b) => b.members.length - a.members.length);

  return { parent, components };
}
