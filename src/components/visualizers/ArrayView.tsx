"use client";

/**
 * ArrayView — visualizes a flat list/tuple of scalars as an indexed row of cells.
 *
 * 🟣 Vumi: this is YOUR component to build out.
 *
 * Props:
 *   - `node`      — the ValueNode for the variable (kind: "list" or "tuple")
 *   - `name`      — the variable name (display as label)
 *   - `diffState` — "added" | "changed" | "unchanged" (use diffRingClass for the highlight ring)
 *
 * What to draw:
 *   A row of boxes, one per item in `node.items`. Each box shows:
 *     - the item's repr (inside the cell)
 *     - the index (below the cell, 0-based)
 *   If `node.truncated` is true, add a "…" cell at the end.
 *   Color the ring using `diffRingClass(diffState)` on the container.
 *
 * Reuse <ValueView node={item} /> inside each cell for color-coded text.
 *
 * Example layout:
 *   arr ──→  [ 5 ][ 2 ][ 9 ][ 1 ][ 7 ]
 *               0    1    2    3    4
 */

import type { ValueNode } from "@/types/snapshot";
import type { ChangeState } from "@/lib/visualizers/step-diff";
import { diffRingClass } from "@/lib/visualizers/step-diff";
import { ValueView } from "@/components/inspector/ValueView";

interface Props {
  name: string;
  node: ValueNode;
  diffState?: ChangeState | "unknown";
}

export function ArrayView({ name, node, diffState = "unknown" }: Props) {
  const items = node.items ?? [];
  const ring = diffRingClass(diffState);

  // ── SCAFFOLD — replace with your styled cells. ──
  return (
    <div className={`rounded-md border bg-card p-3 ${ring}`}>
      <div className="mb-2 font-mono text-[12px] font-medium text-sky-300">{name}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex min-w-8 items-center justify-center rounded border bg-muted px-2 py-1 font-mono text-[12px]">
              <ValueView node={item} />
            </div>
            <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">{i}</span>
          </div>
        ))}
        {node.truncated && (
          <div className="flex flex-col items-center">
            <div className="flex min-w-8 items-center justify-center rounded border border-dashed bg-muted px-2 py-1 font-mono text-[12px] text-muted-foreground">
              …
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
