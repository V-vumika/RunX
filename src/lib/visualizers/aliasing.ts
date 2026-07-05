/**
 * Aliasing / shared-reference detection for the memory visualizer.
 *
 * Walks the {@link ValueNode} trees of a frame's variables and finds objects
 * whose identity (`ValueNode.id`) is reachable from more than one place — i.e.
 * two names (or a name and a nested slot) point at the *same* Python object,
 * like `b = a` or `grid = [row, row]`. Each shared object gets a stable color
 * so the UI can draw matching boxes / arrows for it.
 *
 * This is the data layer for the memory view. Components (e.g. MemoryView)
 * call {@link buildAliasMap} once per render and ask it about any node's `id`.
 *
 * Note: only *reference* kinds are considered (list/tuple/set/dict/object).
 * Primitives (int/str/bool/…) are excluded on purpose — CPython interns small
 * ints and short strings, so equal primitives can share an `id` without that
 * meaning anything to the student.
 */

import type { ValueKind, ValueNode, Variable } from "@/types/snapshot";

/** Kinds for which a shared `id` means real aliasing worth drawing. */
const REFERENCE_KINDS: ReadonlySet<ValueKind> = new Set<ValueKind>([
  "list",
  "tuple",
  "set",
  "deque",
  "dict",
  "object",
]);

/**
 * Distinct, dark-background-friendly hex colors. Assigned to shared objects in
 * order of first appearance, so the same object keeps its color across a render
 * and across boxes/arrows. Plain hex (not Tailwind classes) so it can be used
 * inline for borders, dots, and SVG strokes alike.
 */
export const ALIAS_PALETTE: readonly string[] = [
  "#f472b6", // pink
  "#60a5fa", // blue
  "#34d399", // green
  "#fbbf24", // amber
  "#a78bfa", // violet
  "#f87171", // red
  "#2dd4bf", // teal
  "#fb923c", // orange
];

/** Info about one shared object. */
export interface AliasInfo {
  /** The Python object identity (`ValueNode.id`). */
  id: number;
  /** Stable color for this object (a hex string from {@link ALIAS_PALETTE}). */
  color: string;
  /** How many references point at this object within the inspected scope. */
  refCount: number;
}

/** Lookup built from a set of variables; ask it about any node's `id`. */
export interface AliasMap {
  /** All shared objects, keyed by id, in first-appearance order. */
  byId: Map<number, AliasInfo>;
  /** True when this id is a shared reference (appears in 2+ places). */
  isShared: (id?: number) => boolean;
  /** Alias info for an id, or undefined if it is not shared. */
  infoFor: (id?: number) => AliasInfo | undefined;
}

/** Visit a node and every descendant (items, dict keys+values, attributes). */
function walk(node: ValueNode, visit: (n: ValueNode) => void): void {
  visit(node);
  node.items?.forEach((item) => walk(item, visit));
  node.entries?.forEach((entry) => {
    walk(entry.key, visit);
    walk(entry.value, visit);
  });
  node.attributes?.forEach((attr) => walk(attr.value, visit));
  // Cycles are already broken by the worker (it emits `circular` nodes with no
  // children), so this recursion always terminates.
}

/**
 * Build an {@link AliasMap} for the given variables (typically the current
 * frame's `locals`). Counts how often each reference-kind object id is reached
 * and marks the ones reached 2+ times as shared, assigning each a color.
 */
export function buildAliasMap(variables: Variable[]): AliasMap {
  // Insertion order = first-appearance order, which we reuse for color order.
  const counts = new Map<number, number>();

  for (const variable of variables) {
    walk(variable.value, (node) => {
      if (node.id == null || !REFERENCE_KINDS.has(node.kind)) return;
      counts.set(node.id, (counts.get(node.id) ?? 0) + 1);
    });
  }

  const byId = new Map<number, AliasInfo>();
  let colorIndex = 0;
  for (const [id, refCount] of counts) {
    if (refCount < 2) continue;
    byId.set(id, {
      id,
      color: ALIAS_PALETTE[colorIndex % ALIAS_PALETTE.length],
      refCount,
    });
    colorIndex += 1;
  }

  return {
    byId,
    isShared: (id) => id != null && byId.has(id),
    infoFor: (id) => (id == null ? undefined : byId.get(id)),
  };
}

/** One shared object plus the reference paths that reach it. */
export interface SharedObject {
  id: number;
  color: string;
  refCount: number;
  /** How each reference reaches it, e.g. `a`, `b`, `grid[0]`, `node.next`. */
  paths: string[];
  node: ValueNode;
}

/**
 * For each shared object in `map`, collect the reference paths that reach it
 * (variable names + nested slots). Feeds the memory view.
 */
export function collectSharedRefs(variables: Variable[], map: AliasMap): SharedObject[] {
  const paths = new Map<number, string[]>();
  const nodeFor = new Map<number, ValueNode>();

  const walkPath = (node: ValueNode, path: string) => {
    if (node.id != null && map.isShared(node.id)) {
      const arr = paths.get(node.id) ?? [];
      if (arr.length < 6 && !arr.includes(path)) arr.push(path);
      paths.set(node.id, arr);
      if (!nodeFor.has(node.id)) nodeFor.set(node.id, node);
    }
    node.items?.forEach((it, i) => walkPath(it, `${path}[${i}]`));
    node.entries?.forEach((e) => walkPath(e.value, `${path}[${e.key.repr}]`));
    node.attributes?.forEach((a) => walkPath(a.value, `${path}.${a.name}`));
  };

  for (const v of variables) {
    if (v.name.startsWith("__")) continue;
    walkPath(v.value, v.name);
  }

  const out: SharedObject[] = [];
  for (const [id, info] of map.byId) {
    const node = nodeFor.get(id);
    if (!node) continue;
    out.push({ id, color: info.color, refCount: info.refCount, paths: paths.get(id) ?? [], node });
  }
  return out;
}
