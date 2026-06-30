"use client";

import type { Snapshot } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

export function BinarySearchViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap  = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const arrVar = frame.locals.find((v) => v.value.kind === "list" || v.value.kind === "tuple");
  if (!arrVar?.value.items) return null;

  const arr = arrVar.value.items.map((i) => shortRepr(i, 5));
  const lo  = Number(frame.locals.find((v) => ["lo","low","left","l"].includes(v.name))?.value.value  ?? -1);
  const hi  = Number(frame.locals.find((v) => ["hi","high","right","r"].includes(v.name))?.value.value ?? -1);
  const mid = Number(frame.locals.find((v) => v.name === "mid")?.value.value ?? -1);
  const target = frame.locals.find((v) => v.name === "target" || v.name === "key" || v.name === "val");

  const count  = Math.min(arr.length, 18);
  const W = 300, cellW = Math.floor((W - 16) / count), H = 80;
  const startX = 8;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        binary search · {arrVar.name}
        {target && <span className="ml-2 text-amber-400/70">target = {shortRepr(target.value, 8)}</span>}
      </div>
      <div className="bg-muted/10 flex justify-center py-2">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {arr.slice(0, count).map((v, idx) => {
            const isMid      = idx === mid;
            const inRange    = lo >= 0 && hi >= 0 && idx >= lo && idx <= hi;
            const outOfRange = lo >= 0 && hi >= 0 && !inRange;
            const x = startX + idx * cellW;

            const fill   = isMid      ? "#3D2A00"
                         : inRange    ? "#0C2A4A"
                         : outOfRange ? "transparent"
                         : "#1e1e2e";
            const stroke = isMid      ? "#EF9F27"
                         : inRange    ? "#3B82F6"
                         : outOfRange ? "#1a1a2e"
                         : "#3a3a4a";
            const tc     = isMid      ? "#EF9F27"
                         : inRange    ? "#93C5FD"
                         : outOfRange ? "#2a2a3a"
                         : "#666688";

            return (
              <g key={idx}>
                <rect x={x + 1} y={20} width={cellW - 2} height={22} rx={3}
                  fill={fill} stroke={stroke} strokeWidth={isMid ? 1.5 : 1} />
                <text x={x + cellW / 2} y={35} textAnchor="middle"
                  fontSize={10} fontFamily="var(--font-mono)" fontWeight={isMid ? "700" : "400"} fill={tc}>
                  {v}
                </text>
                {/* pointer labels */}
                {isMid && (
                  <text x={x + cellW / 2} y={15} textAnchor="middle" fontSize={8}
                    fontFamily="var(--font-mono)" fill="#EF9F27">mid</text>
                )}
                {idx === lo && !isMid && (
                  <text x={x + cellW / 2} y={15} textAnchor="middle" fontSize={8}
                    fontFamily="var(--font-mono)" fill="#3B82F6">lo</text>
                )}
                {idx === hi && !isMid && (
                  <text x={x + cellW / 2} y={15} textAnchor="middle" fontSize={8}
                    fontFamily="var(--font-mono)" fill="#3B82F6">hi</text>
                )}
                {/* index */}
                <text x={x + cellW / 2} y={55} textAnchor="middle" fontSize={7}
                  fontFamily="var(--font-mono)" fill="#333355">{idx}</text>
              </g>
            );
          })}

          {/* range bracket */}
          {lo >= 0 && hi >= 0 && hi >= lo && (
            <>
              <line x1={startX + lo * cellW + 1} y1={44}
                x2={startX + (hi + 1) * cellW - 1} y2={44}
                stroke="#3B82F6" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 2" />
            </>
          )}
        </svg>
      </div>
      {/* stats */}
      <div className="flex items-center gap-4 border-t border-border/40 px-3 py-1.5 text-[10px] font-mono">
        <span className="text-muted-foreground">lo <span className="text-sky-400">{lo >= 0 ? lo : "—"}</span></span>
        <span className="text-muted-foreground">mid <span className="text-amber-400">{mid >= 0 ? mid : "—"}</span></span>
        <span className="text-muted-foreground">hi <span className="text-sky-400">{hi >= 0 ? hi : "—"}</span></span>
        {lo >= 0 && hi >= 0 && <span className="text-muted-foreground">range <span className="text-emerald-400">{hi - lo + 1}</span></span>}
      </div>
    </div>
  );
}
