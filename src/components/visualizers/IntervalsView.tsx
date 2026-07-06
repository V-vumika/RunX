"use client";

import type { ValueNode } from "@/types/snapshot";
import { parseIntervals } from "@/lib/visualizers/intervals";

/**
 * IntervalsView (Phase 7) — a list of [start, end] pairs on a shared timeline,
 * so overlaps and gaps are visible at a glance (merge intervals, meeting rooms).
 */
export function IntervalsView({ name, node }: { name: string; node: ValueNode }) {
  const intervals = parseIntervals(node);
  if (intervals.length === 0) return null;

  const lo = Math.min(...intervals.map((i) => i.start));
  const hi = Math.max(...intervals.map((i) => i.end));
  const span = hi - lo || 1;
  const pct = (x: number) => ((x - lo) / span) * 100;

  const ordered = intervals.map((iv, idx) => ({ ...iv, idx })).sort((a, b) => a.start - b.start);

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>{name} · intervals</span>
        <span className="normal-case text-muted-foreground/60">{intervals.length} · [{lo}, {hi}]</span>
      </div>

      <div className="space-y-1 bg-[#0b0b16] p-3">
        {ordered.map((iv) => (
          <div key={iv.idx} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-right font-mono text-[10px] text-muted-foreground/70">
              [{iv.start}, {iv.end}]
            </span>
            <div className="relative h-4 flex-1 rounded bg-muted/20">
              <div
                className="absolute top-0 h-4 rounded bg-sky-500/40 ring-1 ring-sky-400/60"
                style={{ left: `${pct(iv.start)}%`, width: `${Math.max(pct(iv.end) - pct(iv.start), 1.5)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        sorted by start · overlapping bars share a horizontal range
      </div>
    </div>
  );
}
