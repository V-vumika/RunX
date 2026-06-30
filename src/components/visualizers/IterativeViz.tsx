"use client";

import type { Snapshot } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

export function IterativeViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap  = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const loopVars = frame.locals.filter((v) =>
    v.value.kind === "int" && /^[ijk]$|^(idx|index|row|col|count|x|y|n|m)$/.test(v.name)
  );
  const arrVars = frame.locals.filter((v) =>
    v.value.kind === "list" && v.value.items && v.value.items.length > 0
  );

  if (loopVars.length === 0 && arrVars.length === 0) return null;

  const curIdx = Number(frame.locals.find((v) => /^[ij]$|^idx|^index/.test(v.name))?.value.value ?? -1);

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        loop state
      </div>
      <div className="p-3 flex flex-col gap-3">
        {/* loop variable counters */}
        {loopVars.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {loopVars.map((v) => (
              <div key={v.name} className="rounded border border-cyan-500/30 bg-cyan-500/8 px-4 py-2 text-center min-w-[48px]">
                <div className="text-[9px] text-muted-foreground mb-0.5">{v.name}</div>
                <div className="font-mono text-lg font-bold text-cyan-300">{shortRepr(v.value, 6)}</div>
              </div>
            ))}
          </div>
        )}

        {/* arrays with active index highlight */}
        {arrVars.slice(0, 2).map((v) => {
          const items = v.value.items!;
          const count = Math.min(items.length, 16);
          const W = 280, cellW = Math.floor((W) / count), H = 44;
          return (
            <div key={v.name}>
              <div className="text-[10px] text-muted-foreground mb-1">{v.name}</div>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                {items.slice(0, count).map((item, idx) => {
                  const isActive = idx === curIdx;
                  const x = idx * cellW;
                  const fill   = isActive ? "#0C2A4A" : "#12122a";
                  const stroke = isActive ? "#3B82F6" : "#2a2a4a";
                  const tc     = isActive ? "#93C5FD" : "#555577";
                  return (
                    <g key={idx}>
                      <rect x={x+1} y={4} width={cellW-2} height={26} rx={3}
                        fill={fill} stroke={stroke} strokeWidth={isActive ? 1.5 : 1} />
                      <text x={x+cellW/2} y={21} textAnchor="middle"
                        fontSize={10} fontFamily="var(--font-mono)" fontWeight={isActive ? "700" : "400"} fill={tc}>
                        {shortRepr(item, 4)}
                      </text>
                      <text x={x+cellW/2} y={38} textAnchor="middle"
                        fontSize={7} fontFamily="var(--font-mono)" fill="#333355">
                        {idx}
                      </text>
                      {isActive && (
                        <polygon points={`${x+cellW/2-4},${H-2} ${x+cellW/2+4},${H-2} ${x+cellW/2},${H-8}`}
                          fill="#3B82F6" opacity={0.8} />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
