/**
 * Grid detection (Phase 4.3).
 *
 * A 2D list can be a DP table *or* a traversal grid (islands, flood-fill, maze,
 * grid BFS/DFS). They want very different visuals. We route to a grid view when
 * the variable is *named* like a grid, and extract the current (row, col) cursor
 * and the visited cells so the view can highlight the walk — things a DP table
 * doesn't have. Anything else stays a DP table.
 */

import type { ValueNode, Variable } from "@/types/snapshot";

const GRID_NAME = /grid|board|maze|image|field|room|island|matrix|map(?!ping)/i;
const ROW_NAMES = /^(r|row|i|y|nr|cr|sr)$/i;
const COL_NAMES = /^(c|col|j|x|nc|cc|sc)$/i;

export interface GridInfo {
  rows: number;
  cols: number;
  current: { r: number; c: number } | null;
  /** "r,c" keys of visited cells. */
  visited: Set<string>;
}

export function isGridName(name: string): boolean {
  return GRID_NAME.test(name);
}

function intVal(node: ValueNode): number | null {
  if (node.kind !== "int") return null;
  const n = typeof node.value === "number" ? node.value : Number(node.value);
  return Number.isInteger(n) ? n : null;
}

/** Pull visited cells from a set/list of (r,c) tuples, or a 2-D boolean grid. */
function collectVisited(node: ValueNode, rows: number, out: Set<string>): void {
  const items = node.items;
  if (!items || items.length === 0) return;

  const all2D = items.every((it) => it.kind === "list" || it.kind === "tuple");
  const looksBoolGrid =
    all2D && items.length === rows && items.every((row) => (row.items ?? []).some((cell) => cell.kind === "bool"));

  if (looksBoolGrid) {
    items.forEach((row, ri) =>
      (row.items ?? []).forEach((cell, ci) => {
        if (cell.value === true) out.add(`${ri},${ci}`);
      })
    );
    return;
  }

  // Otherwise treat entries as coordinate tuples/lists.
  for (const t of items) {
    const coords = t.items;
    if (coords && coords.length >= 2) {
      const r = intVal(coords[0]);
      const c = intVal(coords[1]);
      if (r !== null && c !== null) out.add(`${r},${c}`);
    }
  }
}

export function detectGrid(node: ValueNode, locals: Variable[]): GridInfo {
  const rows = node.items?.length ?? 0;
  const cols = node.items?.[0]?.items?.length ?? 0;

  let r: number | null = null;
  let c: number | null = null;
  for (const v of locals) {
    if (r === null && ROW_NAMES.test(v.name)) {
      const iv = intVal(v.value);
      if (iv !== null && iv >= 0 && iv < rows) r = iv;
    }
    if (c === null && COL_NAMES.test(v.name)) {
      const iv = intVal(v.value);
      if (iv !== null && iv >= 0 && iv < cols) c = iv;
    }
  }
  const current = r !== null && c !== null ? { r, c } : null;

  const visited = new Set<string>();
  const vv = locals.find((v) => /visited|seen/i.test(v.name));
  if (vv) collectVisited(vv.value, rows, visited);

  return { rows, cols, current, visited };
}
