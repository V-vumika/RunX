"use client";

/**
 * ArrayView — visualizes a flat list/tuple of scalars as an indexed row of
 * cells, each showing the item's repr and its 0-based index. Supports a
 * two-pointer / sliding-window overlay and a diff ring for the last change.
 */

import type { ValueNode } from "@/types/snapshot";
import type { ChangeState } from "@/lib/visualizers/step-diff";
import { diffRingClass } from "@/lib/visualizers/step-diff";
import { ValueView } from "@/components/inspector/ValueView";
import type { PointerOverlay } from "@/lib/visualizers/pointers";

interface Props {
  name: string;
  node: ValueNode;
  diffState?: ChangeState | "unknown";
  /** Two-pointer / sliding-window overlay (Phase 4.1). */
  overlay?: PointerOverlay;
}

export function ArrayView({ name, node, diffState = "unknown", overlay }: Props) {
  const items = node.items ?? [];
  const ring = diffRingClass(diffState);

  const pointers = overlay?.pointers ?? [];
  const window = overlay?.window ?? null;
  const ptrsAt = (i: number) => pointers.filter((p) => p.index === i);
  const inWindow = (i: number) => window != null && i >= window.start && i <= window.end;
  // Pointers sitting at the exclusive end (index === length) render after the last cell.
  const endPointers = pointers.filter((p) => p.index === items.length && items.length > 0);

  return (
    <div className={`rounded-xl border-2 bg-card p-4 shadow-sm transition-all ${ring}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[13px] font-medium text-sky-300">{name}</span>
        <div className="flex items-center gap-1.5">
          {pointers.length > 0 && (
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              {window ? "window" : "pointers"}
            </span>
          )}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            array
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed px-3 py-1.5 text-[12px] text-muted-foreground">
            (empty)
          </div>
        )}
        {items.map((item, i) => {
          const here = ptrsAt(i);
          const active = here.length > 0;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              {/* pointer tags above the cell */}
              <div className="flex min-h-4 flex-wrap justify-center gap-0.5">
                {here.map((p) => (
                  <span key={p.name} className="rounded bg-amber-400/20 px-1 py-0.5 font-mono text-[8px] font-bold text-amber-300">
                    {p.name}↓
                  </span>
                ))}
              </div>
              <div
                className={`flex min-w-10 items-center justify-center rounded-lg border-2 px-2.5 py-1.5 font-mono text-[13px] transition-colors ${
                  active
                    ? "border-amber-400 bg-amber-400/10"
                    : inWindow(i)
                    ? "border-sky-500/40 bg-sky-500/10"
                    : "border-border/60 bg-muted/40"
                }`}
              >
                <ValueView node={item} />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{i}</span>
            </div>
          );
        })}
        {node.truncated && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex min-h-4" />
            <div className="flex min-w-10 items-center justify-center rounded-lg border-2 border-dashed bg-muted/40 px-2.5 py-1.5 font-mono text-[13px] text-muted-foreground">
              …
            </div>
          </div>
        )}
        {endPointers.length > 0 && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex min-h-4 flex-wrap justify-center gap-0.5">
              {endPointers.map((p) => (
                <span key={p.name} className="rounded bg-amber-400/20 px-1 py-0.5 font-mono text-[8px] font-bold text-amber-300">
                  {p.name}↓
                </span>
              ))}
            </div>
            <div className="flex min-w-6 items-center justify-center px-1 py-1.5 font-mono text-[11px] text-muted-foreground/50">
              end
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{items.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
