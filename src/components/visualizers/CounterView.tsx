"use client";

import type { ValueNode } from "@/types/snapshot";
import { parseCounter } from "@/lib/visualizers/counter";

/**
 * CounterView (Phase 7) — a frequency dict as horizontal bars sorted by count,
 * so the most/least common keys are obvious at a glance.
 */
export function CounterView({ name, node }: { name: string; node: ValueNode }) {
  const entries = parseCounter(node);
  if (entries.length === 0) return null;
  const max = Math.max(...entries.map((e) => e.count), 1);

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>{name} · counts</span>
        <span className="normal-case text-muted-foreground/60">{entries.length} keys</span>
      </div>

      <div className="space-y-1 bg-[#0b0b16] p-3">
        {entries.slice(0, 16).map((e) => (
          <div key={e.key} className="flex items-center gap-2">
            <span className="w-14 shrink-0 truncate text-right font-mono text-[11px] text-sky-300">{e.key}</span>
            <div className="h-4 flex-1 rounded bg-muted/20">
              <div
                className="flex h-4 items-center justify-end rounded bg-emerald-500/40 pr-1.5 ring-1 ring-emerald-400/50"
                style={{ width: `${Math.max((e.count / max) * 100, 6)}%` }}
              >
                <span className="font-mono text-[10px] text-emerald-100">{e.count}</span>
              </div>
            </div>
          </div>
        ))}
        {entries.length > 16 && (
          <div className="pl-16 text-[10px] text-muted-foreground/50">+{entries.length - 16} more…</div>
        )}
      </div>
    </div>
  );
}
