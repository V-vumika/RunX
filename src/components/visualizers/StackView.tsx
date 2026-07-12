"use client";

/**
 * StackView — visualizes a list used as a LIFO stack: a vertical stack of
 * cards with the top of the stack (last item) drawn at the top.
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

  return (
    <div className={`rounded-xl border-2 bg-card p-4 shadow-sm transition-all ${ring}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[13px] font-medium text-sky-300">{name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          LIFO stack
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex w-full max-w-56 items-center justify-between gap-2 rounded-lg border px-3 py-1.5 font-mono text-[13px] ${
              i === 0
                ? "border-amber-400 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]"
                : "border-border/60 bg-muted/40"
            }`}
          >
            <ValueView node={item} />
            {i === 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-black">
                top
              </span>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="w-full max-w-56 rounded-lg border border-dashed px-3 py-2 text-center text-[12px] text-muted-foreground">
            (empty)
          </div>
        )}
      </div>
    </div>
  );
}
