"use client";

import type { ValueNode } from "@/types/snapshot";
import type { ChangeState } from "@/lib/visualizers/step-diff";
import { diffRingClass } from "@/lib/visualizers/step-diff";
import { ValueView } from "@/components/inspector/ValueView";

/**
 * SetView — an unordered collection of unique members. Unlike an array, there
 * are no indices (order is meaningless), so members render as a "bag" of chips.
 */
export function SetView({ name, node, diffState = "unknown" }: { name: string; node: ValueNode; diffState?: ChangeState | "unknown" }) {
  const items = node.items ?? [];
  const ring = diffRingClass(diffState);

  return (
    <div className={`rounded-xl border-2 bg-card p-4 shadow-sm transition-all ${ring}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[13px] font-medium text-sky-300">{name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          set · {items.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && (
          <span className="rounded-full border border-dashed px-3 py-1 text-[12px] text-muted-foreground">
            ∅ empty
          </span>
        )}
        {items.map((item, i) => (
          <span
            key={i}
            className="rounded-full border-2 border-border/60 bg-muted/40 px-3 py-1 font-mono text-[13px]"
          >
            <ValueView node={item} />
          </span>
        ))}
        {node.truncated && (
          <span className="rounded-full border-2 border-dashed bg-muted/40 px-3 py-1 font-mono text-[13px] text-muted-foreground">
            …
          </span>
        )}
      </div>
    </div>
  );
}
