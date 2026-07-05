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

  return (
    <div className={`rounded-xl border-2 bg-card p-4 shadow-sm transition-all ${ring}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[13px] font-medium text-sky-300">{name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          array
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed px-3 py-1.5 text-[12px] text-muted-foreground">
            (empty)
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="flex min-w-10 items-center justify-center rounded-lg border-2 border-border/60 bg-muted/40 px-2.5 py-1.5 font-mono text-[13px]">
              <ValueView node={item} />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{i}</span>
          </div>
        ))}
        {node.truncated && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex min-w-10 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40 px-2.5 py-1.5 font-mono text-[13px] text-muted-foreground">
              …
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
