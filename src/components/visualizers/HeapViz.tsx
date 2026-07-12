"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";
import { VIZ } from "@/lib/visualizers/palette";

export function HeapViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap  = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const heapVar = frame.locals.find(
    (v) =>
      (v.value.kind === "list") &&
      v.value.items &&
      v.value.items.length > 0 &&
      /heap|pq/i.test(v.name)
  );
  if (!heapVar?.value.items) return null;

  const arr = heapVar.value.items.map((i: ValueNode) => shortRepr(i, 6));
  const n = arr.length;

  // highlight active indices (common heap-op variable names)
  const i1 = Number(frame.locals.find((v) => ["i", "idx", "index"].includes(v.name))?.value.value ?? -1);
  const i2 = Number(frame.locals.find((v) => v.name === "j")?.value.value ?? -1);

  // ── tree layout (binary heap as complete binary tree) ──────────────────────
  const W = 300;
  const levels = Math.ceil(Math.log2(n + 1));
  const treeH = levels * 42 + 16;

  function posFor(idx: number): { x: number; y: number } {
    const level = Math.floor(Math.log2(idx + 1));
    const posInLevel = idx - (Math.pow(2, level) - 1);
    const slotsInLevel = Math.pow(2, level);
    const slotW = W / slotsInLevel;
    const x = slotW * (posInLevel + 0.5);
    const y = 20 + level * 42;
    return { x, y };
  }

  const edgesArr: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let idx = 1; idx < n; idx++) {
    const parent = Math.floor((idx - 1) / 2);
    const p1 = posFor(parent), p2 = posFor(idx);
    edgesArr.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  }

  // ── array row layout ─────────────────────────────────────────────────────
  const count = Math.min(n, 16);
  const cellW = Math.max(22, Math.floor((W - 16) / count));
  const arrH = 48;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        heap · {heapVar.name} · {n} elements
      </div>

      {/* tree view */}
      <div className="flex justify-center py-2" style={{ background: VIZ.canvasBg }}>
        <svg width={W} height={treeH} viewBox={`0 0 ${W} ${treeH}`}>
          {edgesArr.map((e, idx) => (
            <line key={idx} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={VIZ.idleLine} strokeWidth={1.5} />
          ))}
          {arr.map((val, idx) => {
            const p = posFor(idx);
            const isActive = idx === i1 || idx === i2;
            const isRoot = idx === 0;
            const fill   = isActive ? VIZ.activeFill : isRoot ? VIZ.doneFill : VIZ.idleFill;
            const stroke = isActive ? VIZ.activeBorder : isRoot ? VIZ.doneBorder : VIZ.idleBorder;
            const tc     = isActive ? VIZ.activeText : isRoot ? VIZ.doneText : VIZ.idleTextFaint;
            return (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r={13} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text x={p.x} y={p.y + 4} textAnchor="middle"
                  fontSize={10} fontFamily="var(--font-mono)" fontWeight="700" fill={tc}>
                  {val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* array view */}
      <div className="border-t border-border/40 bg-muted/10 flex justify-center py-2">
        <svg width={count * cellW + 16} height={arrH} viewBox={`0 0 ${count * cellW + 16} ${arrH}`}>
          {arr.slice(0, count).map((val, idx) => {
            const isActive = idx === i1 || idx === i2;
            const x = 8 + idx * cellW;
            const fill   = isActive ? VIZ.activeFill : VIZ.idleFill;
            const stroke = isActive ? VIZ.activeBorder : VIZ.idleBorder;
            const tc     = isActive ? VIZ.activeText : VIZ.idleTextFaint;
            return (
              <g key={idx}>
                <rect x={x + 1} y={4} width={cellW - 4} height={24} rx={3}
                  fill={fill} stroke={stroke} strokeWidth={isActive ? 1.5 : 1} />
                <text x={x + cellW / 2} y={20} textAnchor="middle"
                  fontSize={9} fontFamily="var(--font-mono)" fontWeight={isActive ? "700" : "400"} fill={tc}>
                  {val}
                </text>
                <text x={x + cellW / 2} y={38} textAnchor="middle"
                  fontSize={7} fontFamily="var(--font-mono)" fill={VIZ.idleTextFaint}>{idx}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-3 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: VIZ.doneBar }} />root (min/max)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: VIZ.activeBar }} />active</span>
      </div>
    </div>
  );
}
