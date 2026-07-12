"use client";

/**
 * QueueView — visualizes a list used as a FIFO queue: a horizontal row with
 * the front (next to dequeue) on the left and the back (enqueue side) on the right.
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

  return (
    <div className={`rounded-xl border-2 bg-card p-4 shadow-sm transition-all ${ring}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[13px] font-medium text-sky-300">{name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          FIFO queue
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          FRONT
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex min-w-10 items-center justify-center rounded-lg border px-2.5 py-1.5 font-mono text-[13px] ${
                i === 0
                  ? "border-emerald-400 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(52,211,153,0.3)]"
                  : "border-border/60 bg-muted/40"
              }`}
            >
              <ValueView node={item} />
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-lg border border-dashed px-3 py-1.5 text-[12px] text-muted-foreground">
              (empty)
            </div>
          )}
          {node.truncated && (
            <div className="flex min-w-8 items-center justify-center rounded-lg border border-dashed px-2 py-1.5 font-mono text-[12px] text-muted-foreground">
              …
            </div>
          )}
        </div>
        <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
          BACK
        </span>
      </div>
    </div>
  );
}
