"use client";

import type { ValueNode } from "@/types/snapshot";
import type { GridInfo } from "@/lib/visualizers/grid";
import { shortRepr } from "@/lib/explain/narrate";

/**
 * GridView (Phase 4.3) — a 2-D traversal grid (islands / flood-fill / maze /
 * grid BFS-DFS). Distinct from the DP table: it highlights the current
 * (row, col) cursor and shades visited cells so you can watch the walk.
 */
export function GridView({ name, node, grid }: { name: string; node: ValueNode; grid?: GridInfo }) {
  const rows = node.items ?? [];
  const current = grid?.current ?? null;
  const visited = grid?.visited ?? new Set<string>();

  const isCurrent = (r: number, c: number) => current != null && current.r === r && current.c === c;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>{name} · grid</span>
        <span className="flex items-center gap-2 normal-case">
          {current && <span className="text-amber-300">({current.r}, {current.c})</span>}
          {visited.size > 0 && <span className="text-sky-300/70">{visited.size} visited</span>}
        </span>
      </div>

      <div className="overflow-auto bg-[#0b0b16] p-3">
        <div className="inline-flex flex-col gap-1">
          {rows.map((row, r) => (
            <div key={r} className="flex gap-1">
              {(row.items ?? []).map((cell, c) => {
                const cur = isCurrent(r, c);
                const seen = visited.has(`${r},${c}`);
                return (
                  <div
                    key={c}
                    className={`flex size-8 items-center justify-center rounded border font-mono text-[12px] transition-colors ${
                      cur
                        ? "border-amber-400 bg-amber-400/20 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]"
                        : seen
                        ? "border-sky-500/40 bg-sky-500/12 text-sky-200/90"
                        : "border-border/50 bg-muted/30 text-foreground/80"
                    }`}
                  >
                    {shortRepr(cell, 3)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {(current || visited.size > 0) && (
        <div className="flex gap-3 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
          {current && (
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-sm bg-amber-400" /> current
            </span>
          )}
          {visited.size > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-sm bg-sky-500/60" /> visited
            </span>
          )}
        </div>
      )}
    </div>
  );
}
