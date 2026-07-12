"use client";

import type { Snapshot } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";
import { VIZ } from "@/lib/visualizers/palette";

export function RecursionViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  if (!snap || snap.stack.length <= 1) return null;

  const frames  = snap.stack.slice(-8);
  const isRet   = snap.event === "return";
  const W = 300, frameH = 28, gap = 5;
  const totalH = frames.length * (frameH + gap) + 20;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        call stack · depth {snap.stack.length}
      </div>
      <div className="flex justify-center py-2" style={{ background: VIZ.canvasBg }}>
        <svg width={W} height={totalH} viewBox={`0 0 ${W} ${totalH}`}>
          {frames.map((f, i) => {
            const isActive  = i === frames.length - 1;
            const indent    = i * 10;
            const y         = i * (frameH + gap) + 10;
            const fw        = W - 16 - indent;
            const argStr    = f.locals.slice(0, 2).map((v) => `${v.name}=${shortRepr(v.value, 7)}`).join(", ");

            const fill   = isActive ? VIZ.activeFill : VIZ.idleFill;
            const stroke = isActive ? VIZ.activeBorder : VIZ.idleBorder;
            const tc     = isActive ? VIZ.activeText : VIZ.idleTextFaint;
            const tagTc  = isActive ? VIZ.activeBar : VIZ.idleTextFaint;

            return (
              <g key={i}>
                <rect x={8 + indent} y={y} width={fw} height={frameH} rx={5}
                  fill={fill} stroke={stroke} strokeWidth={isActive ? 1.5 : 1} />
                {/* depth number */}
                <text x={16 + indent} y={y + 18} fontSize={9} fontFamily="var(--font-mono)"
                  fill={tagTc} opacity={0.7}>{i + 1}</text>
                {/* function name */}
                <text x={28 + indent} y={y + 18} fontSize={11} fontFamily="var(--font-mono)"
                  fontWeight={isActive ? "600" : "400"} fill={tc}>
                  {f.functionName}({argStr})
                </text>
                {/* tag */}
                <text x={W - 10} y={y + 18} textAnchor="end" fontSize={9}
                  fontFamily="var(--font-mono)" fill={tagTc}>
                  {isActive ? (isRet ? "returning" : "← active") : "waiting…"}
                </text>
                {/* active glow */}
                {isActive && (
                  <rect x={7 + indent} y={y - 1} width={fw + 2} height={frameH + 2} rx={6}
                    fill="none" stroke={VIZ.activeBar} strokeWidth={0.5} opacity={0.4} />
                )}
              </g>
            );
          })}

          {/* return value bubble */}
          {isRet && snap.returnValue && (
            <g>
              <rect x={W / 2 - 60} y={totalH - 16} width={120} height={14} rx={7}
                fill={VIZ.doneFill} stroke={VIZ.doneBorder} strokeWidth={1} />
              <text x={W / 2} y={totalH - 5} textAnchor="middle" fontSize={9}
                fontFamily="var(--font-mono)" fill={VIZ.doneText}>
                returns {shortRepr(snap.returnValue, 16)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
