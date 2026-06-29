"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

function parseAdjacency(node: ValueNode | undefined): Map<string, string[]> | null {
  if (!node || node.kind !== "dict" || !node.entries) return null;
  const adj = new Map<string, string[]>();
  for (const { key, value } of node.entries) {
    const k = String(key.value ?? key.repr ?? "?");
    const neighbors: string[] = [];
    if (value.kind === "list" || value.kind === "set" || value.kind === "deque") {
      for (const item of value.items ?? []) neighbors.push(String(item.value ?? item.repr ?? "?"));
    }
    adj.set(k, neighbors);
  }
  return adj.size > 0 ? adj : null;
}

function parseSet(node: ValueNode | undefined): Set<string> {
  const s = new Set<string>();
  if (!node) return s;
  for (const item of node.items ?? []) s.add(String(item.value ?? item.repr ?? "?"));
  return s;
}

function circleLayout(keys: string[], cx: number, cy: number, r: number) {
  const pos = new Map<string, { x: number; y: number }>();
  keys.forEach((k, i) => {
    const angle = (2 * Math.PI * i) / keys.length - Math.PI / 2;
    pos.set(k, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  });
  return pos;
}

export function GraphViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const allLocals = snap?.stack.flatMap((f) => f.locals) ?? [];
  const frame = snap?.stack.at(-1);

  const graphVar   = allLocals.find((v) => ["graph","adj","adjacency","G"].includes(v.name));
  const visitedVar = frame?.locals.find((v) => v.name === "visited");
  const queueVar   = frame?.locals.find((v) => v.name === "queue" || v.name === "stack");
  const currentVar = frame?.locals.find((v) => ["node","curr","current","vertex","u","v"].includes(v.name));

  const adj        = parseAdjacency(graphVar?.value);
  const visited    = parseSet(visitedVar?.value);
  const inQueue    = parseSet(queueVar?.value);
  const currentNode = currentVar ? String(currentVar.value.value ?? currentVar.value.repr ?? "") : null;

  if (!adj) {
    // text fallback
    if (!visitedVar && !queueVar) return null;
    return (
      <div className="overflow-hidden rounded-md border border-border/50">
        <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">traversal state</div>
        <div className="grid grid-cols-2 gap-1.5 p-2.5">
          {currentVar && <div className="col-span-2 rounded border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5">
            <div className="text-[10px] text-muted-foreground mb-0.5">current</div>
            <div className="font-mono text-[11px] font-medium text-violet-300">{shortRepr(currentVar.value, 24)}</div>
          </div>}
          {queueVar && <div className="rounded border border-border/40 bg-muted/30 px-2 py-1.5">
            <div className="text-[10px] text-muted-foreground mb-0.5">{queueVar.name}</div>
            <div className="font-mono text-[11px] text-amber-300">{shortRepr(queueVar.value, 28)}</div>
          </div>}
          {visitedVar && <div className="rounded border border-border/40 bg-muted/30 px-2 py-1.5">
            <div className="text-[10px] text-muted-foreground mb-0.5">visited</div>
            <div className="font-mono text-[11px] text-emerald-300">{shortRepr(visitedVar.value, 28)}</div>
          </div>}
        </div>
      </div>
    );
  }

  const keys  = Array.from(adj.keys());
  const W = 300, H = 200;
  const cx = 150, cy = 100;
  const r = Math.min(75, Math.max(40, 30 + keys.length * 6));
  const pos = circleLayout(keys, cx, cy, r);
  const nodeR = Math.max(12, Math.min(16, 32 - keys.length));

  const edges: [string, string][] = [];
  const seen = new Set<string>();
  adj.forEach((neighbors, from) => {
    neighbors.forEach((to) => {
      const key = [from, to].sort().join("--");
      if (!seen.has(key)) { seen.add(key); edges.push([from, to]); }
    });
  });

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        graph · {keys.length} nodes · {edges.length} edges
      </div>

      <div className="bg-[#0d0d1a] flex justify-center">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* grid dots */}
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => (
              <circle key={`${row}-${col}`} cx={col * 44 + 10} cy={row * 36 + 10}
                r={1} fill="#ffffff" opacity={0.04} />
            ))
          )}

          {/* edges */}
          {edges.map(([a, b]) => {
            const pa = pos.get(a), pb = pos.get(b);
            if (!pa || !pb) return null;
            const bothVisited = visited.has(a) && visited.has(b);
            const aCurr = a === currentNode, bCurr = b === currentNode;
            const active = aCurr || bCurr;
            return (
              <g key={`${a}-${b}`}>
                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={bothVisited ? "#1D9E75" : active ? "#7F77DD" : "#2a2a4a"}
                  strokeWidth={bothVisited ? 2 : active ? 1.5 : 1}
                  strokeOpacity={bothVisited ? 0.7 : active ? 0.6 : 0.35} />
              </g>
            );
          })}

          {/* nodes */}
          {keys.map((k) => {
            const p = pos.get(k);
            if (!p) return null;
            const isCurrent = k === currentNode;
            const isVisited = visited.has(k);
            const isInQueue = inQueue.has(k);

            const fill   = isCurrent ? "#4A3FB5" : isVisited ? "#0F5C3A" : isInQueue ? "#7A4800" : "#12122a";
            const stroke = isCurrent ? "#9B96E8" : isVisited ? "#1D9E75" : isInQueue ? "#EF9F27" : "#2a2a4a";
            const glow   = isCurrent ? "#7F77DD"  : isVisited ? "#1D9E75" : isInQueue ? "#EF9F27" : null;
            const tc     = (isCurrent || isVisited || isInQueue) ? "#fff" : "#555577";

            return (
              <g key={k}>
                {glow && <circle cx={p.x} cy={p.y} r={nodeR + 6} fill={glow} opacity={0.12} />}
                {isCurrent && (
                  <circle cx={p.x} cy={p.y} r={nodeR + 4}
                    fill="none" stroke="#9B96E8" strokeWidth={1}
                    strokeDasharray="3 2" strokeOpacity={0.5} />
                )}
                <circle cx={p.x} cy={p.y} r={nodeR} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text x={p.x} y={p.y + 4} textAnchor="middle"
                  fontSize={11} fontFamily="var(--font-mono)" fontWeight="700" fill={tc}>
                  {k}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* legend + live state */}
      <div className="flex items-center gap-3 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#9B96E8]" />current</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#EF9F27]" />queue</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#1D9E75]" />visited</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 border-t border-border/40 p-2">
        {queueVar && <div className="rounded border border-border/40 bg-muted/30 px-2 py-1">
          <div className="mb-0.5 text-[10px] text-muted-foreground">{queueVar.name}</div>
          <div className="font-mono text-[11px] font-medium text-amber-300 break-all">{shortRepr(queueVar.value, 32)}</div>
        </div>}
        {visitedVar && <div className="rounded border border-border/40 bg-muted/30 px-2 py-1">
          <div className="mb-0.5 text-[10px] text-muted-foreground">visited</div>
          <div className="font-mono text-[11px] font-medium text-emerald-300 break-all">{shortRepr(visitedVar.value, 32)}</div>
        </div>}
      </div>
    </div>
  );
}
