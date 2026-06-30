"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

/** Detect a 2D list (list of lists) — used for DP tables like dp[i][j] */
function as2D(node: ValueNode | undefined): string[][] | null {
  if (!node || node.kind !== "list" || !node.items) return null;
  const rows = node.items;
  if (rows.length === 0) return null;
  if (!rows.every((r) => r.kind === "list")) return null;
  return rows.map((r) => (r.items ?? []).map((c) => shortRepr(c, 5)));
}

/** Detect a 1D list of numbers/strings — used for DP arrays like dp[i] */
function as1D(node: ValueNode | undefined): string[] | null {
  if (!node || node.kind !== "list" || !node.items) return null;
  if (node.items.some((i) => i.kind === "list")) return null;
  return node.items.map((i) => shortRepr(i, 6));
}

export function DPTableViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap  = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const dpVar = frame.locals.find((v) =>
    /^dp$|^table$|^memo$|^cache$/.test(v.name) || /dp/i.test(v.name)
  );
  if (!dpVar) return null;

  const grid = as2D(dpVar.value);
  const row1D = as1D(dpVar.value);

  // active indices — common DP loop variable names
  const i = Number(frame.locals.find((v) => v.name === "i")?.value.value ?? -1);
  const j = Number(frame.locals.find((v) => v.name === "j")?.value.value ?? -1);

  if (grid) {
    const rows = grid.length;
    const cols = Math.max(...grid.map((r) => r.length));
    const cell = Math.max(22, Math.min(34, Math.floor(280 / cols)));
    const W = cols * cell + 30, H = rows * cell + 30;

    return (
      <div className="overflow-hidden rounded-md border border-border/50">
        <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          dp table · {dpVar.name} · {rows}×{cols}
        </div>
        <div className="bg-[#0d0d1a] flex justify-center overflow-x-auto py-2">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {/* column headers */}
            {Array.from({ length: cols }).map((_, c) => (
              <text key={`ch-${c}`} x={30 + c * cell + cell / 2} y={14} textAnchor="middle"
                fontSize={8} fontFamily="var(--font-mono)" fill="#444466">{c}</text>
            ))}
            {grid.map((row, r) => (
              <g key={r}>
                {/* row header */}
                <text x={14} y={26 + r * cell + cell / 2 + 3} textAnchor="middle"
                  fontSize={8} fontFamily="var(--font-mono)" fill="#444466">{r}</text>
                {row.map((val, c) => {
                  const isActive = r === i && c === j;
                  const isRowActive = r === i && !isActive;
                  const isColActive = c === j && !isActive;
                  const x = 30 + c * cell, y = 20 + r * cell;
                  const fill   = isActive ? "#3D2A00" : isRowActive || isColActive ? "#1a1a30" : "#12122a";
                  const stroke = isActive ? "#EF9F27" : isRowActive || isColActive ? "#3a3a5a" : "#2a2a4a";
                  const tc     = isActive ? "#EF9F27" : "#8888aa";
                  return (
                    <g key={c}>
                      <rect x={x} y={y} width={cell - 2} height={cell - 2} rx={3}
                        fill={fill} stroke={stroke} strokeWidth={isActive ? 1.5 : 1} />
                      <text x={x + (cell - 2) / 2} y={y + (cell - 2) / 2 + 4} textAnchor="middle"
                        fontSize={10} fontFamily="var(--font-mono)" fontWeight={isActive ? "700" : "400"} fill={tc}>
                        {val}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </div>
        <div className="flex items-center gap-3 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#EF9F27]" />dp[i][j] — current cell</span>
          {i >= 0 && <span>i = <span className="font-mono text-foreground/70">{i}</span></span>}
          {j >= 0 && <span>j = <span className="font-mono text-foreground/70">{j}</span></span>}
        </div>
      </div>
    );
  }

  if (row1D) {
    const count = row1D.length;
    const cell = Math.max(26, Math.min(40, Math.floor(280 / count)));
    const W = count * cell + 16, H = 56;

    return (
      <div className="overflow-hidden rounded-md border border-border/50">
        <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          dp array · {dpVar.name} · {count} cells
        </div>
        <div className="bg-[#0d0d1a] flex justify-center overflow-x-auto py-2">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {row1D.map((val, idx) => {
              const isActive = idx === i;
              const x = 8 + idx * cell;
              const fill   = isActive ? "#3D2A00" : "#12122a";
              const stroke = isActive ? "#EF9F27" : "#2a2a4a";
              const tc     = isActive ? "#EF9F27" : "#8888aa";
              return (
                <g key={idx}>
                  <rect x={x} y={10} width={cell - 4} height={28} rx={4}
                    fill={fill} stroke={stroke} strokeWidth={isActive ? 1.5 : 1} />
                  <text x={x + (cell - 4) / 2} y={28} textAnchor="middle"
                    fontSize={11} fontFamily="var(--font-mono)" fontWeight={isActive ? "700" : "400"} fill={tc}>
                    {val}
                  </text>
                  <text x={x + (cell - 4) / 2} y={48} textAnchor="middle"
                    fontSize={8} fontFamily="var(--font-mono)" fill="#444466">{idx}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  return null;
}
