"use client";

import type { Snapshot } from "@/types/snapshot";

export function SortViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const frame = snap?.stack.at(-1);
  const arrVar = frame?.locals.find(
    (v) =>
      (v.value.kind === "list" || v.value.kind === "tuple") &&
      v.value.items?.every((i) => i.kind === "int" || i.kind === "float")
  );
  if (!arrVar?.value.items) return null;

  const arr = arrVar.value.items.map((i) => Number(i.value ?? 0));
  const max = Math.max(...arr, 1);
  const j    = Number(frame?.locals.find((v) => v.name === "j")?.value.value ?? -1);
  const iVal = Number(frame?.locals.find((v) => v.name === "i")?.value.value ?? -1);
  const sortedFrom = iVal >= 0 ? arr.length - iVal : arr.length + 1;

  const W = 300, H = 120;
  const count = Math.min(arr.length, 14);
  const cellW = Math.floor((W - 16) / count);
  const barMaxH = 52;
  const startX = 8;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        array · {arrVar.name} · {arr.length} elements
      </div>
      <div className="bg-muted/10 py-2 flex justify-center">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {arr.slice(0, count).map((v, idx) => {
            const isCmp    = idx === j || idx === j + 1;
            const isSorted = iVal >= 0 && idx >= sortedFrom;
            const x = startX + idx * cellW;
            const bh = Math.max(6, Math.round((v / max) * barMaxH));
            const by = H - bh - 22;

            const fillBar   = isSorted ? "#1D9E75" : isCmp ? "#EF9F27" : "#3B5BDB";
            const fillCell  = isSorted ? "#E1F5EE" : isCmp ? "#FAEEDA" : "#1e1e2e";
            const strokeCell = isSorted ? "#5DCAA5" : isCmp ? "#EF9F27" : "#3a3a4a";
            const textColor = isSorted ? "#085041" : isCmp ? "#633806" : "#8888aa";

            return (
              <g key={idx}>
                {/* bar */}
                <rect x={x + 2} y={by} width={cellW - 4} height={bh}
                  rx={3} fill={fillBar} opacity={isSorted ? 0.7 : isCmp ? 0.85 : 0.45} />
                {/* cell box */}
                <rect x={x + 1} y={H - 20} width={cellW - 2} height={18}
                  rx={3} fill={fillCell} stroke={strokeCell} strokeWidth={1} />
                {/* value */}
                <text x={x + cellW / 2} y={H - 7} textAnchor="middle"
                  fontSize={10} fontFamily="var(--font-mono)" fontWeight="600" fill={textColor}>
                  {v}
                </text>
                {/* index */}
                <text x={x + cellW / 2} y={by - 3} textAnchor="middle"
                  fontSize={8} fontFamily="var(--font-mono)" fill="#555577" opacity={0.6}>
                  {idx}
                </text>
                {/* compare arrows */}
                {(idx === j) && (
                  <text x={x + cellW / 2} y={H - 23} textAnchor="middle" fontSize={8} fill="#EF9F27">▲</text>
                )}
                {(idx === j + 1) && (
                  <text x={x + cellW / 2} y={H - 23} textAnchor="middle" fontSize={8} fill="#EF9F27">▲</text>
                )}
              </g>
            );
          })}

          {/* swap indicator */}
          {j >= 0 && j + 1 < arr.length && (
            <text x={W / 2} y={12} textAnchor="middle" fontSize={9} fill="#EF9F27" opacity={0.8}>
              comparing [{j}] ↔ [{j + 1}]
            </text>
          )}
        </svg>
      </div>
      {/* legend */}
      <div className="flex items-center gap-4 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#EF9F27]" />comparing</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#1D9E75]" />sorted</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#3B5BDB] opacity-60" />unsorted</span>
      </div>
    </div>
  );
}
