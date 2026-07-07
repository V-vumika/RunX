"use client";

import type { ValueNode } from "@/types/snapshot";
import { buildFenwick } from "@/lib/visualizers/fenwick";

/**
 * FenwickView (Phase 7) — a Binary Indexed Tree shown as its slots, each
 * labelled with the index range it aggregates (`tree[i]` covers
 * `[i - lowbit(i) + 1 .. i]`). That range is exactly what a plain array view
 * can't show, and it's the whole idea behind why prefix sums are O(log n).
 */
export function FenwickView({
  name,
  node,
  diffState,
}: {
  name: string;
  node: ValueNode;
  diffState?: "added" | "changed" | "unchanged";
}) {
  const cells = buildFenwick(node);

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>{name} · fenwick tree</span>
        <span className="normal-case text-muted-foreground/60">
          {cells.length - 1} elements
          {diffState === "changed" && <span className="ml-1 text-amber-400">· updated</span>}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-1.5 bg-[#0b0b16] p-3">
        {cells.map((c) => {
          const dummy = c.covers === null;
          const width = c.covers ? c.covers[1] - c.covers[0] + 1 : 0;
          // wider coverage ⇒ warmer accent, so the "big jumps" stand out.
          const accent = dummy
            ? "#3a3a4a"
            : width >= 4
            ? "#fbbf24"
            : width >= 2
            ? "#60a5fa"
            : "#34d399";
          return (
            <div key={c.index} className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[9px] text-muted-foreground/70">{c.index}</span>
              <div
                className="flex h-9 min-w-9 items-center justify-center rounded-md px-1.5 font-mono text-[13px] font-bold"
                style={{
                  color: dummy ? "#55556a" : accent,
                  background: dummy ? "#16161f" : `${accent}1a`,
                  border: `1px solid ${accent}${dummy ? "33" : "66"}`,
                }}
                title={c.covers ? `tree[${c.index}] = sum of [${c.covers[0]}..${c.covers[1]}]` : "unused slot"}
              >
                {c.value}
              </div>
              <span className="font-mono text-[8.5px]" style={{ color: dummy ? "#44445a" : `${accent}bb` }}>
                {c.covers ? (width === 1 ? `${c.covers[0]}` : `${c.covers[0]}–${c.covers[1]}`) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        top = index · bottom = the range that slot sums · slot 0 is unused (1-indexed)
      </div>
    </div>
  );
}
