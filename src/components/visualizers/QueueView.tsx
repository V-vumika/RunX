"use client";

/**
 * QueueView — visualizes a list used as a FIFO queue.
 *
 * 🟣 Vumi: this is YOUR component to build out.
 *
 * Props: same as ArrayView — `node`, `name`, `diffState`.
 *
 * What to draw:
 *   A horizontal row of boxes where the LEFT side is the FRONT (next to dequeue)
 *   and the RIGHT side is the BACK (where new items enqueue).
 *   Add "FRONT →" label on the left and "← BACK" label on the right.
 *   Color the ring using `diffRingClass(diffState)`.
 *
 * Example layout (items = [1, 2, 3]):
 *   FRONT →  [ 1 ][ 2 ][ 3 ]  ← BACK
 *              out              in
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

export function QueueView({ name, node, diffState = "unknown" }: Props) {
  const items = node.items ?? [];
  const ring = diffRingClass(diffState);

  // ── SCAFFOLD — replace with your styled queue row. ──
  return (
    <div className={`rounded-md border bg-card p-3 ${ring}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[12px] font-medium text-sky-300">{name}</span>
        <span className="text-[10px] text-muted-foreground">FIFO queue</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-emerald-400">FRONT →</span>
        <div className="flex flex-wrap gap-1">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex min-w-[2.5rem] items-center justify-center rounded border px-2 py-1 font-mono text-[12px] ${
                i === 0 ? "border-emerald-400/50 bg-emerald-400/10" : "bg-muted"
              }`}
            >
              <ValueView node={item} />
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded border border-dashed px-3 py-1.5 text-[12px] text-muted-foreground">
              (empty)
            </div>
          )}
          {node.truncated && (
            <div className="flex min-w-[2rem] items-center justify-center rounded border border-dashed px-2 py-1 font-mono text-[12px] text-muted-foreground">
              …
            </div>
          )}
        </div>
        <span className="text-[10px] text-violet-400">← BACK</span>
      </div>
    </div>
  );
}
