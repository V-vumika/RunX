"use client";

import type { Snapshot } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";
import { VIZ } from "@/lib/visualizers/palette";

/** Neutral boundary-pointer accent (lo/hi) — a landmark, not a state, so it
 *  sits outside the idle/active/pending/done bucket system. Reuses frost. */
const POINTER = "#d1e4fa";

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
        {target && <span className="ml-2" style={{ color: VIZ.pendingText }}>target = {shortRepr(target.value, 8)}</span>}
      </div>
      <div className="flex justify-center py-2" style={{ background: VIZ.canvasBg }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {arr.slice(0, count).map((v, idx) => {
            const isMid      = idx === mid;
            const inRange    = lo >= 0 && hi >= 0 && idx >= lo && idx <= hi;
            const outOfRange = lo >= 0 && hi >= 0 && !inRange;
            const x = startX + idx * cellW;

            const fill   = isMid      ? VIZ.activeFill
                         : inRange    ? VIZ.pendingFill
                         : outOfRange ? "transparent"
                         : VIZ.idleFill;
            const stroke = isMid      ? VIZ.activeBorder
                         : inRange    ? VIZ.pendingBorder
                         : outOfRange ? "rgba(186,215,247,0.05)"
                         : VIZ.idleBorder;
            const tc     = isMid      ? VIZ.activeText
                         : inRange    ? VIZ.pendingText
                         : outOfRange ? "rgba(157,167,186,0.3)"
                         : VIZ.idleTextFaint;

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
                    fontFamily="var(--font-mono)" fill={VIZ.activeBar}>mid</text>
                )}
                {idx === lo && !isMid && (
                  <text x={x + cellW / 2} y={15} textAnchor="middle" fontSize={8}
                    fontFamily="var(--font-mono)" fill={POINTER}>lo</text>
                )}
                {idx === hi && !isMid && (
                  <text x={x + cellW / 2} y={15} textAnchor="middle" fontSize={8}
                    fontFamily="var(--font-mono)" fill={POINTER}>hi</text>
                )}
                {/* index */}
                <text x={x + cellW / 2} y={55} textAnchor="middle" fontSize={7}
                  fontFamily="var(--font-mono)" fill={VIZ.idleTextFaint}>{idx}</text>
              </g>
            );
          })}

          {/* range bracket */}
          {lo >= 0 && hi >= 0 && hi >= lo && (
            <>
              <line x1={startX + lo * cellW + 1} y1={44}
                x2={startX + (hi + 1) * cellW - 1} y2={44}
                stroke={POINTER} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 2" />
            </>
          )}
        </svg>
      </div>
      {/* stats */}
      <div className="flex items-center gap-4 border-t border-border/40 px-3 py-1.5 text-[10px] font-mono">
        <span className="text-muted-foreground">lo <span style={{ color: POINTER }}>{lo >= 0 ? lo : "—"}</span></span>
        <span className="text-muted-foreground">mid <span style={{ color: VIZ.activeBar }}>{mid >= 0 ? mid : "—"}</span></span>
        <span className="text-muted-foreground">hi <span style={{ color: POINTER }}>{hi >= 0 ? hi : "—"}</span></span>
        {lo >= 0 && hi >= 0 && <span className="text-muted-foreground">range <span style={{ color: VIZ.doneBar }}>{hi - lo + 1}</span></span>}
      </div>
    </div>
  );
}
