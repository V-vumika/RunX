"use client";

import type { Snapshot } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";
import { buildAliasMap, collectSharedRefs } from "@/lib/visualizers/aliasing";

/**
 * MemoryView (Phase 5.2) — shows aliasing: when two names (or nested slots)
 * point at the *same* object, they share one box. This surfaces the classic
 * gotcha that mutating through one name changes all of them. Renders nothing
 * unless there's real sharing to teach.
 */
export function MemoryView({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const frame = snapshots[step]?.stack.at(-1);
  if (!frame) return null;

  const map = buildAliasMap(frame.locals);
  if (map.byId.size === 0) return null;

  const shared = collectSharedRefs(frame.locals, map).filter((o) => o.paths.length >= 2);
  if (shared.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        memory · shared references
      </div>

      <div className="space-y-2.5 bg-[#0b0b16] p-3">
        {shared.map((o) => (
          <div key={o.id} className="flex items-center gap-2">
            {/* names/paths pointing at this object */}
            <div className="flex flex-wrap items-center gap-1">
              {o.paths.map((p) => (
                <span
                  key={p}
                  className="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium"
                  style={{ color: o.color, background: `${o.color}22`, border: `1px solid ${o.color}55` }}
                >
                  {p}
                </span>
              ))}
            </div>
            <span className="text-base" style={{ color: o.color }}>→</span>
            {/* the single shared object */}
            <div
              className="min-w-0 flex-1 rounded-md px-2.5 py-1.5 font-mono text-[12px]"
              style={{ background: `${o.color}14`, border: `1.5px solid ${o.color}` }}
            >
              <span className="text-muted-foreground/60">{o.node.pyType}</span>{" "}
              <span className="text-foreground/90">{shortRepr(o.node, 40)}</span>
            </div>
          </div>
        ))}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          These names point at the <span className="text-foreground/90">same object</span> — changing it
          through one name changes it for all of them.
        </p>
      </div>
    </div>
  );
}
