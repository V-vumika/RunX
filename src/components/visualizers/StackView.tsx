"use client";

/**
 * StackView — visualizes a list used as a LIFO stack.
 *
 * 🟣 Vumi: this is YOUR component to build out.
 *
 * Props: same as ArrayView — `node`, `name`, `diffState`.
 *
 * What to draw:
 *   A vertical stack of cards, top of stack at the TOP of the visual.
 *   `node.items[last]` = top of stack, `node.items[0]` = bottom.
 *   Draw items in reverse order (last item first, visually on top).
 *   Add a small "TOP ↑" or "← top" label near the top item.
 *   Color the ring using `diffRingClass(diffState)`.
 *
 * Example layout (items = [1, 2, 3], top = 3):
 *   ┌─────────┐  ← TOP
 *   │    3    │
 *   ├─────────┤
 *   │    2    │
 *   ├─────────┤
 *   │    1    │
 *   └─────────┘
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

export function StackView({ name, node, diffState = "unknown" }: Props) {
  const items = [...(node.items ?? [])].reverse(); // top first
  const ring = diffRingClass(diffState);

  // ── SCAFFOLD — replace with your styled vertical stack. ──
  return (
    <div className={`rounded-md border bg-card p-3 ${ring}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[12px] font-medium text-sky-300">{name}</span>
        <span className="text-[10px] text-muted-foreground">LIFO stack</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded border px-3 py-1 font-mono text-[12px] ${
              i === 0 ? "border-amber-400/50 bg-amber-400/10" : "bg-muted"
            }`}
          >
            <ValueView node={item} />
            {i === 0 && (
              <span className="text-[10px] text-amber-400">← top</span>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded border border-dashed px-3 py-2 text-center text-[12px] text-muted-foreground">
            (empty)
          </div>
        )}
      </div>
    </div>
  );
}
