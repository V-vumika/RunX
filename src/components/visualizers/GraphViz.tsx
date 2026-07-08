"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";
import { parseGraph, parseDist, parseFrontierNodes } from "@/lib/visualizers/graph";

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

const fmtDist = (d: number | undefined): string =>
  d === undefined || !Number.isFinite(d) ? "∞" : String(d);

export function GraphViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const allLocals = snap?.stack.flatMap((f) => f.locals) ?? [];
  const frame = snap?.stack.at(-1);

  const graphVar   = allLocals.find((v) => ["graph","adj","adjacency","G"].includes(v.name));
  const visitedVar = frame?.locals.find((v) => v.name === "visited");
  const distVar    = allLocals.find((v) => ["dist","distance","distances","d"].includes(v.name));
  const queueVar   = frame?.locals.find((v) =>
    ["queue","stack","heap","pq","frontier","min_heap","minheap","heapq"].includes(v.name));
  // Source (popped) node vs the neighbour currently being relaxed — kept
  // separate so we can light up the exact edge under consideration.
  const currentVar  = frame?.locals.find((v) => ["u","node","curr","current","vertex"].includes(v.name));
  const neighborVar = frame?.locals.find((v) => ["v","neighbor","neighbour","nei","to","child"].includes(v.name));

  const graph      = parseGraph(graphVar?.value);
  const visited    = parseSet(visitedVar?.value);
  const dist       = parseDist(distVar?.value);
  const currentNode = currentVar ? String(currentVar.value.value ?? currentVar.value.repr ?? "") : null;
  const neighborNode = neighborVar ? String(neighborVar.value.value ?? neighborVar.value.repr ?? "") : null;

  const nodeSet    = new Set(graph?.nodes ?? []);
  // Dijkstra's frontier is a heap of (dist, node) tuples; fall back to a bare set.
  const inQueue    = graph
    ? parseFrontierNodes(queueVar?.value, nodeSet)
    : parseSet(queueVar?.value);

  // The edge being relaxed this step = (current node → neighbour under test).
  const relaxEdge: [string, string] | null =
    currentNode && neighborNode && currentNode !== neighborNode &&
    nodeSet.has(currentNode) && nodeSet.has(neighborNode)
      ? [currentNode, neighborNode]
      : null;

  // Nodes whose shortest distance dropped since the previous step (Dijkstra).
  const prevDistVar = snapshots[step - 1]?.stack
    .flatMap((f) => f.locals)
    .find((v) => ["dist","distance","distances","d"].includes(v.name));
  const prevDist = parseDist(prevDistVar?.value);
  const improved = new Set<string>();
  if (dist.size > 0 && prevDist.size > 0) {
    for (const [k, dv] of dist) {
      const pv = prevDist.get(k);
      if (Number.isFinite(dv) && (pv === undefined || !Number.isFinite(pv) || dv < pv)) improved.add(k);
    }
  }
  const sameEdge = (a: string, b: string) =>
    relaxEdge != null && ((a === relaxEdge[0] && b === relaxEdge[1]) || (a === relaxEdge[1] && b === relaxEdge[0]));

  if (!graph) {
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

  const keys  = graph.nodes;
  const weighted = graph.weighted;
  const hasDist = dist.size > 0;
  const W = 300, H = 200;
  const cx = 150, cy = 100;
  const r = Math.min(75, Math.max(40, 30 + keys.length * 6));
  const pos = circleLayout(keys, cx, cy, r);
  const nodeR = Math.max(12, Math.min(16, 32 - keys.length));

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {weighted ? "weighted graph" : "graph"} · {keys.length} nodes · {graph.edges.length} edges
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
          {graph.edges.map(({ from: a, to: b, w }) => {
            const pa = pos.get(a), pb = pos.get(b);
            if (!pa || !pb) return null;
            const bothVisited = visited.has(a) && visited.has(b);
            const aCurr = a === currentNode, bCurr = b === currentNode;
            const active = aCurr || bCurr;
            const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
            const relaxing = sameEdge(a, b);
            return (
              <g key={`${a}-${b}`}>
                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={bothVisited ? "#1D9E75" : active ? "#7F77DD" : "#2a2a4a"}
                  strokeWidth={bothVisited ? 2 : active ? 1.5 : 1}
                  strokeOpacity={bothVisited ? 0.7 : active ? 0.6 : 0.35} />
                {/* edge being relaxed this step — bright, marching dashes */}
                {relaxing && (
                  <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke="#EF9F27" strokeWidth={2.5} strokeDasharray="5 3" strokeOpacity={0.95}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.5s" repeatCount="indefinite" />
                  </line>
                )}
                {weighted && w != null && (
                  <>
                    <rect x={mx - 8} y={my - 6} width={16} height={11} rx={2}
                      fill="#0d0d1a" opacity={0.85} />
                    <text x={mx} y={my + 2.5} textAnchor="middle"
                      fontSize={9} fontFamily="var(--font-mono)" fontWeight="700"
                      fill={active ? "#9B96E8" : "#8888aa"}>
                      {w}
                    </text>
                  </>
                )}
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

            const isImproved = improved.has(k);
            return (
              <g key={k}>
                {glow && <circle cx={p.x} cy={p.y} r={nodeR + 6} fill={glow} opacity={0.12} />}
                {/* distance just dropped — pulse a green ring */}
                {isImproved && (
                  <circle cx={p.x} cy={p.y} r={nodeR + 2} fill="none" stroke="#34d399" strokeWidth={2}>
                    <animate attributeName="r" values={`${nodeR + 2};${nodeR + 9};${nodeR + 2}`} dur="0.9s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.9;0;0.9" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                )}
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
                {/* running shortest distance under each node (Dijkstra) */}
                {hasDist && (
                  <text x={p.x} y={p.y + nodeR + 9} textAnchor="middle"
                    fontSize={8.5} fontFamily="var(--font-mono)" fontWeight="700"
                    fill={isImproved ? "#34d399" : dist.has(k) && Number.isFinite(dist.get(k)!) ? "#5BC8F5" : "#44445e"}>
                    {fmtDist(dist.get(k))}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* legend + live state */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#9B96E8]" />current</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#EF9F27]" />frontier</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#1D9E75]" />visited</span>
        {hasDist && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#5BC8F5]" />distance</span>}
      </div>
      <div className="grid grid-cols-2 gap-1.5 border-t border-border/40 p-2">
        {queueVar && <div className="rounded border border-border/40 bg-muted/30 px-2 py-1">
          <div className="mb-0.5 text-[10px] text-muted-foreground">{queueVar.name}</div>
          <div className="font-mono text-[11px] font-medium text-amber-300 break-all">{shortRepr(queueVar.value, 32)}</div>
        </div>}
        {distVar && <div className="rounded border border-border/40 bg-muted/30 px-2 py-1">
          <div className="mb-0.5 text-[10px] text-muted-foreground">{distVar.name}</div>
          <div className="font-mono text-[11px] font-medium text-sky-300 break-all">{shortRepr(distVar.value, 32)}</div>
        </div>}
        {visitedVar && !distVar && <div className="rounded border border-border/40 bg-muted/30 px-2 py-1">
          <div className="mb-0.5 text-[10px] text-muted-foreground">visited</div>
          <div className="font-mono text-[11px] font-medium text-emerald-300 break-all">{shortRepr(visitedVar.value, 32)}</div>
        </div>}
      </div>
    </div>
  );
}
