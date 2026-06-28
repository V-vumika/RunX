"use client";

import { useMemo } from "react";
import { TriangleAlert, Lightbulb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useExecutionStore } from "@/lib/store/execution-store";
import { narrateAll, shortRepr, type StepChange, type StepKind } from "@/lib/explain/narrate";
import { classifyProgram, type AlgoKind } from "@/lib/explain/classify";
import { explainException } from "@/lib/explain/exceptions";
import type { Snapshot, Variable, ValueNode } from "@/types/snapshot";

// ── helpers ───────────────────────────────────────────────────────────────────

const KIND_CLASS: Record<StepKind, string> = {
  call:   "bg-violet-500/15 text-violet-300",
  return: "bg-emerald-500/15 text-emerald-300",
  mutate: "bg-amber-500/15 text-amber-300",
  assign: "bg-sky-500/15 text-sky-300",
  branch: "bg-fuchsia-500/15 text-fuchsia-300",
  loop:   "bg-cyan-500/15 text-cyan-300",
  print:  "bg-teal-500/15 text-teal-300",
  error:  "bg-destructive/15 text-destructive",
  start:  "bg-primary/15 text-primary",
  step:   "bg-muted text-muted-foreground",
};

function KindPill({ kind }: { kind: StepKind }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${KIND_CLASS[kind] ?? KIND_CLASS.step}`}>
      {kind}
    </span>
  );
}

/** Live values of the variables on the running line — Thonny-style chips. */
function StepValues({ values }: { values?: { name: string; repr: string }[] }) {
  if (!values || values.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">values</span>
      {values.map((v) => (
        <span
          key={v.name}
          className="rounded-md border border-border/50 bg-muted/40 px-1.5 py-0.5 font-mono text-[11px]"
        >
          <span className="text-muted-foreground">{v.name}</span>
          <span className="text-muted-foreground/40"> = </span>
          <span className="text-foreground/90">{v.repr}</span>
        </span>
      ))}
    </div>
  );
}

/** What this step changed — animated before→new badges. */
function StepChanges({ changes }: { changes?: StepChange[] }) {
  if (!changes || changes.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {changes.slice(0, 4).map((c, i) => (
        <div
          key={i}
          className="flex animate-in fade-in slide-in-from-bottom-1 items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-xs"
        >
          {c.after === null ? (
            // Standalone phrase (swap / append / multi-change).
            <span className="text-emerald-200/90">{c.label}</span>
          ) : c.before === null ? (
            // Newly created.
            <>
              <span className="font-medium text-emerald-300">{c.label}</span>
              <span className="text-muted-foreground/50">=</span>
              <span className="font-medium text-emerald-300">{c.after}</span>
              <span className="ml-auto rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-emerald-300/80">
                new
              </span>
            </>
          ) : (
            // Reassigned: before → after.
            <>
              <span className="font-medium text-foreground/90">{c.label}</span>
              <span className="text-muted-foreground/40 line-through">{c.before}</span>
              <span className="text-emerald-400">→</span>
              <span className="font-medium text-emerald-300">{c.after}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function getLocals(snap: Snapshot | undefined): Map<string, ValueNode> {
  const m = new Map<string, ValueNode>();
  snap?.stack.at(-1)?.locals.forEach((v: Variable) => m.set(v.name, v.value));
  return m;
}

// ── algo badge ────────────────────────────────────────────────────────────────

const ALGO_META: Record<AlgoKind, { label: string; color: string }> = {
  sort:           { label: "Sort",          color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  "binary-search":{ label: "Binary Search", color: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  "linear-search":{ label: "Linear Search", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  bfs:            { label: "BFS",           color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  dfs:            { label: "DFS",           color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  tree:           { label: "Tree",          color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  "linked-list":  { label: "Linked List",   color: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30" },
  recursion:      { label: "Recursion",     color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  "nested-loop":  { label: "Nested Loop",   color: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  iterative:      { label: "Iterative",     color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  script:         { label: "Script",        color: "bg-muted text-muted-foreground border-border" },
};

function AlgoBadge({ kind, complexity }: { kind: AlgoKind; complexity: string }) {
  const m = ALGO_META[kind] ?? ALGO_META.script;
  return (
    <div className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${m.color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      <span className="text-xs font-medium">{m.label}</span>
      <span className="font-mono text-[10px] opacity-60">{complexity}</span>
    </div>
  );
}

// ── variable diff ─────────────────────────────────────────────────────────────

function VariableDiff({ prev, curr }: { prev: Snapshot | undefined; curr: Snapshot | undefined }) {
  const prevMap = getLocals(prev);
  const currMap = getLocals(curr);
  if (currMap.size === 0) return null;

  const rows: { name: string; oldV: string | null; newV: string; changed: boolean }[] = [];
  currMap.forEach((node, name) => {
    const pNode = prevMap.get(name);
    const nv = shortRepr(node);
    const ov = pNode ? shortRepr(pNode) : null;
    rows.push({ name, oldV: ov, newV: nv, changed: ov !== null && ov !== nv });
  });

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        variables
      </div>
      {rows.map((r) => (
        <div key={r.name} className={`flex items-center gap-2 border-b border-border/30 px-3 py-1.5 last:border-b-0 transition-colors ${r.changed ? "bg-emerald-500/5" : ""}`}>
          <span className={`h-1.25 w-1.25 shrink-0 rounded-full ${r.changed ? "bg-emerald-400" : "bg-transparent"}`} />
          <span className={`min-w-16 font-mono text-[11px] ${r.changed ? "text-emerald-300/80" : "text-muted-foreground/60"}`}>
            {r.name}
          </span>
          <span className="flex flex-1 items-center gap-1.5 font-mono text-[11px]">
            {r.changed && r.oldV !== null ? (
              <>
                <span className="text-muted-foreground/40 line-through">{r.oldV}</span>
                <span className="text-muted-foreground/40 text-[10px]">→</span>
                <span className="font-medium text-emerald-400">{r.newV}</span>
              </>
            ) : (
              <span className="text-muted-foreground/50">{r.newV}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── SORT visualizer ───────────────────────────────────────────────────────────

function SortViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const frame = snap?.stack.at(-1);
  const arrVar = frame?.locals.find(
    (v) => (v.value.kind === "list" || v.value.kind === "tuple") &&
      v.value.items?.every((i) => i.kind === "int" || i.kind === "float")
  );
  if (!arrVar?.value.items) return null;

  const arr = arrVar.value.items.map((i) => Number(i.value ?? 0));
  const max = Math.max(...arr, 1);
  const j = Number(frame?.locals.find((v) => v.name === "j")?.value.value ?? -1);
  const iVal = Number(frame?.locals.find((v) => v.name === "i")?.value.value ?? -1);
  const sortedFrom = iVal >= 0 ? arr.length - iVal : arr.length + 1;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        array · {arrVar.name}
      </div>
      <div className="flex flex-col gap-2 px-3 py-2.5">
        <div className="flex gap-1.5">
          {arr.slice(0, 14).map((v, idx) => {
            const isCmp = idx === j || idx === j + 1;
            const isSorted = iVal >= 0 && idx >= sortedFrom;
            return (
              <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
                <span className="font-mono text-[9px] text-muted-foreground/40">[{idx}]</span>
                <div className={`flex h-7 w-full items-center justify-center rounded border font-mono text-[11px] font-medium transition-all duration-200 ${
                  isSorted ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : isCmp   ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                  : "border-border/40 bg-muted/40 text-muted-foreground"
                }`}>{v}</div>
              </div>
            );
          })}
        </div>
        <div className="flex h-12 items-end gap-1.5">
          {arr.slice(0, 14).map((v, idx) => {
            const isCmp = idx === j || idx === j + 1;
            const isSorted = iVal >= 0 && idx >= sortedFrom;
            return (
              <div key={idx} style={{ height: Math.max(4, Math.round((v / max) * 44)) }}
                className={`flex-1 rounded-sm transition-all duration-200 ${
                  isSorted ? "bg-emerald-500/60" : isCmp ? "bg-amber-400/70" : "bg-sky-500/30"
                }`} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── RECURSION stack visualizer ────────────────────────────────────────────────

function RecursionViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  if (!snap || snap.stack.length <= 1) return null;
  const frames = snap.stack.slice(-8);
  const isRet = snap.event === "return";

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        call stack · depth {snap.stack.length}
      </div>
      <div className="flex flex-col gap-1.5 p-2.5">
        {frames.map((f, i) => {
          const isActive = i === frames.length - 1;
          const argStr = f.locals.slice(0, 2).map((v) => `${v.name}=${shortRepr(v.value, 8)}`).join(", ");
          return (
            <div key={i} style={{ marginLeft: i * 8 }}
              className={`flex items-center gap-2 rounded border px-2 py-1 font-mono text-[11px] transition-all duration-150 ${
                isActive ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                : "border-border/30 bg-muted/30 text-muted-foreground/50"
              }`}>
              <span className={`h-1.25 w-1.25 shrink-0 rounded-full ${isActive ? "bg-violet-400" : "bg-muted-foreground/25"}`} />
              <span className="flex-1">{f.functionName}({argStr})</span>
              <span className="text-[10px] opacity-60">
                {isActive ? (isRet ? "returning" : "← active") : "waiting"}
              </span>
            </div>
          );
        })}
        {isRet && snap.returnValue && (
          <div className="mt-1 flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/8 px-2 py-1">
            <span className="text-[10px] text-muted-foreground">returns</span>
            <span className="font-mono text-[11px] font-medium text-emerald-400">{shortRepr(snap.returnValue, 20)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BINARY SEARCH visualizer ──────────────────────────────────────────────────

function BinarySearchViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const arrVar = frame.locals.find((v) => v.value.kind === "list" || v.value.kind === "tuple");
  if (!arrVar?.value.items) return null;

  const arr = arrVar.value.items.map((i) => shortRepr(i, 6));
  const lo  = Number(frame.locals.find((v) => v.name === "lo"  || v.name === "low"  || v.name === "left")?.value.value  ?? -1);
  const hi  = Number(frame.locals.find((v) => v.name === "hi"  || v.name === "high" || v.name === "right")?.value.value ?? -1);
  const mid = Number(frame.locals.find((v) => v.name === "mid")?.value.value ?? -1);

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        binary search · {arrVar.name}
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="flex gap-1">
          {arr.slice(0, 16).map((v, idx) => {
            const isMid = idx === mid;
            const inRange = lo >= 0 && hi >= 0 && idx >= lo && idx <= hi;
            const outRange = lo >= 0 && hi >= 0 && !inRange;
            return (
              <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
                <div className={`flex h-6 w-full items-center justify-center rounded border font-mono text-[10px] font-medium transition-all duration-200 ${
                  isMid     ? "border-amber-400/60 bg-amber-400/20 text-amber-300"
                  : inRange ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                  : outRange? "border-border/20 bg-transparent text-muted-foreground/25"
                  : "border-border/40 bg-muted/40 text-muted-foreground"
                }`}>{v}</div>
                {(isMid || idx === lo || idx === hi) && (
                  <span className="font-mono text-[8px] text-muted-foreground/50">
                    {isMid ? "mid" : idx === lo ? "lo" : "hi"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="text-muted-foreground">lo <span className="font-mono text-sky-400">{lo}</span></span>
          <span className="text-muted-foreground">mid <span className="font-mono text-amber-400">{mid}</span></span>
          <span className="text-muted-foreground">hi <span className="font-mono text-sky-400">{hi}</span></span>
        </div>
      </div>
    </div>
  );
}

// ── BFS / DFS visualizer — actual 2D SVG graph ───────────────────────────────

/** Parse a dict ValueNode into adjacency list: Map<string, string[]> */
function parseAdjacency(node: ValueNode | undefined): Map<string, string[]> | null {
  if (!node || node.kind !== "dict" || !node.entries) return null;
  const adj = new Map<string, string[]>();
  for (const { key, value } of node.entries) {
    const k = String(key.value ?? key.repr ?? "?");
    const neighbors: string[] = [];
    if (value.kind === "list" || value.kind === "set" || value.kind === "deque") {
      for (const item of value.items ?? []) {
        neighbors.push(String(item.value ?? item.repr ?? "?"));
      }
    }
    adj.set(k, neighbors);
  }
  return adj.size > 0 ? adj : null;
}

/** Parse a set/list ValueNode into a Set<string> */
function parseSet(node: ValueNode | undefined): Set<string> {
  const s = new Set<string>();
  if (!node) return s;
  for (const item of node.items ?? []) s.add(String(item.value ?? item.repr ?? "?"));
  return s;
}

/** Layout nodes in a circle */
function circleLayout(
  keys: string[],
  cx: number, cy: number, r: number
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  keys.forEach((k, i) => {
    const angle = (2 * Math.PI * i) / keys.length - Math.PI / 2;
    pos.set(k, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  });
  return pos;
}

function GraphViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];

  // look in all frames for the graph variable
  const allLocals = snap?.stack.flatMap((f) => f.locals) ?? [];
  const frame = snap?.stack.at(-1);

  const graphVar = allLocals.find((v) => v.name === "graph" || v.name === "adj" || v.name === "adjacency");
  const visitedVar = frame?.locals.find((v) => v.name === "visited");
  const queueVar   = frame?.locals.find((v) => v.name === "queue" || v.name === "stack");
  const currentVar = frame?.locals.find((v) => v.name === "node" || v.name === "curr" || v.name === "current" || v.name === "vertex");

  const adj = parseAdjacency(graphVar?.value);
  const visited = parseSet(visitedVar?.value);
  const inQueue = parseSet(queueVar?.value);
  const currentNode = currentVar ? String(currentVar.value.value ?? currentVar.value.repr ?? "") : null;

  if (!adj) {
    // fallback: just show text state
    if (!visitedVar && !queueVar) return null;
    return (
      <div className="overflow-hidden rounded-md border border-border/50">
        <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          traversal state
        </div>
        <div className="flex flex-col gap-1.5 p-2.5">
          {currentVar && (
              <div className="flex items-center gap-2 rounded border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5">
                <span className="text-[10px] text-muted-foreground min-w-13">current</span>
              <span className="font-mono text-[11px] font-medium text-violet-300">{shortRepr(currentVar.value, 24)}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {queueVar && (
              <div className="rounded border border-border/40 bg-muted/30 px-2.5 py-1.5">
                <div className="mb-1 text-[10px] text-muted-foreground">{queueVar.name}</div>
                <div className="font-mono text-[11px] font-medium text-amber-300">{shortRepr(queueVar.value, 28)}</div>
              </div>
            )}
            {visitedVar && (
              <div className="rounded border border-border/40 bg-muted/30 px-2.5 py-1.5">
                <div className="mb-1 text-[10px] text-muted-foreground">visited</div>
                <div className="font-mono text-[11px] font-medium text-emerald-300">{shortRepr(visitedVar.value, 28)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Build 2D SVG graph
  const keys = Array.from(adj.keys());
  const W = 300, H = 180, cx = 150, cy = 90, r = Math.min(70, 60 + keys.length * 2);
  const pos = circleLayout(keys, cx, cy, r);
  const nodeR = 14;

  // collect all edges (deduplicated for undirected)
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

      {/* 2D graph SVG */}
      <div className="flex justify-center bg-muted/20 py-2">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* edges */}
          {edges.map(([a, b]) => {
            const pa = pos.get(a), pb = pos.get(b);
            if (!pa || !pb) return null;
            const bothVisited = visited.has(a) && visited.has(b);
            return (
              <line key={`${a}-${b}`}
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={bothVisited ? "#1D9E75" : "#3a3a4a"}
                strokeWidth={bothVisited ? 1.5 : 1}
                strokeOpacity={bothVisited ? 0.6 : 0.4}
              />
            );
          })}

          {/* nodes */}
          {keys.map((k) => {
            const p = pos.get(k);
            if (!p) return null;
            const isCurrent  = k === currentNode;
            const isVisited  = visited.has(k);
            const isInQueue  = inQueue.has(k);

            const fill   = isCurrent ? "#7F77DD"
                         : isVisited ? "#1D9E75"
                         : isInQueue ? "#EF9F27"
                         : "#1e1e2e";
            const stroke = isCurrent ? "#AFA9EC"
                         : isVisited ? "#5DCAA5"
                         : isInQueue ? "#d48a1a"
                         : "#3a3a4a";
            const textColor = (isCurrent || isVisited || isInQueue) ? "#fff" : "#8888aa";

            return (
              <g key={k}>
                <circle cx={p.x} cy={p.y} r={nodeR} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text x={p.x} y={p.y + 4} textAnchor="middle"
                  fontSize={11} fontFamily="var(--font-mono)"
                  fontWeight="600" fill={textColor}>
                  {k}
                </text>
                {isCurrent && (
                  <circle cx={p.x} cy={p.y} r={nodeR + 4}
                    fill="none" stroke="#7F77DD" strokeWidth={1} strokeOpacity={0.4}
                    strokeDasharray="3 2" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* legend + live state */}
      <div className="flex items-center gap-3 border-t border-border/40 px-3 py-1.5 text-[10px]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7F77DD]" />current</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#EF9F27]" />in queue</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#1D9E75]" />visited</span>
      </div>

      {/* queue + visited text */}
      <div className="grid grid-cols-2 gap-1.5 border-t border-border/40 p-2">
        {queueVar && (
          <div className="rounded border border-border/40 bg-muted/30 px-2 py-1">
            <div className="mb-0.5 text-[10px] text-muted-foreground">{queueVar.name}</div>
            <div className="font-mono text-[11px] font-medium text-amber-300 break-all">{shortRepr(queueVar.value, 32)}</div>
          </div>
        )}
        {visitedVar && (
          <div className="rounded border border-border/40 bg-muted/30 px-2 py-1">
            <div className="mb-0.5 text-[10px] text-muted-foreground">visited</div>
            <div className="font-mono text-[11px] font-medium text-emerald-300 break-all">{shortRepr(visitedVar.value, 32)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TREE visualizer — actual 2D SVG ──────────────────────────────────────────

interface TreeNode { val: string; left?: TreeNode; right?: TreeNode; id: number }

/** Recursively parse a ValueNode into a TreeNode tree */
function parseTreeNode(node: ValueNode | undefined | null, counter: { n: number }, depth = 0): TreeNode | undefined {
  if (!node || node.kind === "none" || depth > 6) return undefined;
  const id = ++counter.n;

  if (node.kind === "object" && node.attributes) {
    const valAttr   = node.attributes.find((a) => a.name === "val" || a.name === "value" || a.name === "data");
    const leftAttr  = node.attributes.find((a) => a.name === "left");
    const rightAttr = node.attributes.find((a) => a.name === "right");
    if (valAttr) return {
      id, val: shortRepr(valAttr.value, 4),
      left:  parseTreeNode(leftAttr?.value,  counter, depth + 1),
      right: parseTreeNode(rightAttr?.value, counter, depth + 1),
    };
  }

  if (node.kind === "dict" && node.entries) {
    const valEntry   = node.entries.find((e) => ["val","value","data"].includes(String(e.key.value)));
    const leftEntry  = node.entries.find((e) => e.key.value === "left");
    const rightEntry = node.entries.find((e) => e.key.value === "right");
    if (valEntry) return {
      id, val: shortRepr(valEntry.value, 4),
      left:  parseTreeNode(leftEntry?.value,  counter, depth + 1),
      right: parseTreeNode(rightEntry?.value, counter, depth + 1),
    };
  }

  if (node.kind === "int" || node.kind === "str" || node.kind === "float") {
    return { id, val: shortRepr(node, 4) };
  }

  return undefined;
}

/** Compute x,y positions for each node using simple recursive layout */
interface NodePos { x: number; y: number; node: TreeNode }
function layoutTree(
  root: TreeNode | undefined,
  x: number, y: number, spread: number,
  result: NodePos[] = []
): NodePos[] {
  if (!root) return result;
  result.push({ x, y, node: root });
  if (root.left)  layoutTree(root.left,  x - spread, y + 44, spread / 2, result);
  if (root.right) layoutTree(root.right, x + spread, y + 44, spread / 2, result);
  return result;
}

/** Collect edges as [parentId, childId, px, py, cx, cy] */
function collectEdges(
  root: TreeNode | undefined,
  x: number, y: number, spread: number,
  result: [number,number,number,number,number,number][] = []
): [number,number,number,number,number,number][] {
  if (!root) return result;
  if (root.left) {
    const cx = x - spread, cy = y + 44;
    result.push([root.id, root.left.id, x, y, cx, cy]);
    collectEdges(root.left,  cx, cy, spread / 2, result);
  }
  if (root.right) {
    const cx = x + spread, cy = y + 44;
    result.push([root.id, root.right.id, x, y, cx, cy]);
    collectEdges(root.right, cx, cy, spread / 2, result);
  }
  return result;
}

function TreeViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  if (!snap) return null;

  // find root/node variable — check all frames
  const allLocals = snap.stack.flatMap((f) => f.locals);
  const rootVar = allLocals.find((v) => v.name === "root") ??
                  snap.stack.at(-1)?.locals.find((v) => v.name === "node" || v.name === "curr" || v.name === "tree");

  // current node being visited
  const currFrame = snap.stack.at(-1);
  const currNodeVar = currFrame?.locals.find((v) => v.name === "node" || v.name === "curr");
  const currentVal = currNodeVar ? shortRepr(currNodeVar.value, 4) : null;

  // collect visited node values from call stack args
  const visitedVals = new Set<string>();
  snap.stack.forEach((f) => {
    const nv = f.locals.find((v) => v.name === "node" || v.name === "curr" || v.name === "root");
    if (nv && nv.value.kind !== "none") visitedVals.add(shortRepr(nv.value, 4));
  });

  // parse tree from root variable
  const counter = { n: 0 };
  const treeRoot = parseTreeNode(rootVar?.value, counter);

  if (!treeRoot) {
    // fallback: show call stack depth chain
    const depth = snap.stack.length;
    return (
      <div className="overflow-hidden rounded-md border border-border/50">
        <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          tree traversal · depth {depth}
        </div>
        <div className="p-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {snap.stack.map((f, i) => {
              const isActive = i === snap.stack.length - 1;
              const nv = f.locals.find((v) => ["node","root","curr","val"].includes(v.name));
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`flex h-7 min-w-7 items-center justify-center rounded-full border px-1.5 font-mono text-[10px] font-semibold ${
                    isActive ? "border-violet-500/50 bg-violet-500/20 text-violet-200"
                    : "border-border/30 bg-muted/30 text-muted-foreground/40"
                  }`}>
                    {nv ? shortRepr(nv.value, 4) : i + 1}
                  </div>
                  {i < snap.stack.length - 1 && <span className="text-muted-foreground/25 text-xs">›</span>}
                </div>
              );
            })}
          </div>
          {currNodeVar && (
            <div className="flex items-center gap-2 rounded border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5">
              <span className="text-[10px] text-muted-foreground">current node</span>
              <span className="font-mono text-[11px] font-medium text-violet-300">{shortRepr(currNodeVar.value, 20)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // layout tree
  const W = 300, startX = 150, startY = 22, initSpread = 60;
  const positions = layoutTree(treeRoot, startX, startY, initSpread);
  const edges = collectEdges(treeRoot, startX, startY, initSpread);
  const maxY = Math.max(...positions.map((p) => p.y)) + 28;
  const H = Math.max(120, maxY);
  const nodeR = 13;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        binary tree · depth {snap.stack.length - 1}
      </div>

      <div className="flex justify-center bg-muted/20 py-2">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* edges */}
          {edges.map(([pid, cid, px, py, cx, cy]) => (
            <line key={`${pid}-${cid}`}
              x1={px} y1={py} x2={cx} y2={cy}
              stroke="#3a3a4a" strokeWidth={1.5} strokeOpacity={0.6} />
          ))}

          {/* nodes */}
          {positions.map(({ x, y, node }) => {
            const isCurrent = node.val === currentVal;
            const isVisited = visitedVals.has(node.val) && !isCurrent;
            const fill   = isCurrent ? "#7F77DD" : isVisited ? "#1D9E75" : "#1e1e2e";
            const stroke = isCurrent ? "#AFA9EC" : isVisited ? "#5DCAA5" : "#3a3a4a";
            const tc     = (isCurrent || isVisited) ? "#fff" : "#8888aa";
            return (
              <g key={node.id}>
                <circle cx={x} cy={y} r={nodeR} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text x={x} y={y + 4} textAnchor="middle"
                  fontSize={10} fontFamily="var(--font-mono)" fontWeight="600" fill={tc}>
                  {node.val}
                </text>
                {isCurrent && (
                  <circle cx={x} cy={y} r={nodeR + 4}
                    fill="none" stroke="#7F77DD" strokeWidth={1}
                    strokeOpacity={0.4} strokeDasharray="3 2" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* legend */}
      <div className="flex items-center gap-3 border-t border-border/40 px-3 py-1.5 text-[10px]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7F77DD]" />current</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#1D9E75]" />visited</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#1e1e2e] border border-[#3a3a4a]" />unvisited</span>
      </div>
    </div>
  );
}

// ── LINKED LIST visualizer ────────────────────────────────────────────────────

function LinkedListViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const curr = frame.locals.find((v) => v.name === "curr" || v.name === "current" || v.name === "node" || v.name === "ptr");
  const head = frame.locals.find((v) => v.name === "head");
  const prev = frame.locals.find((v) => v.name === "prev");
  const nxt  = frame.locals.find((v) => v.name === "next");

  if (!curr && !head) return null;

  const pointers = [
    head && { label: "head", value: shortRepr(head.value, 16), color: "text-amber-300 border-amber-500/40 bg-amber-500/8" },
    prev && { label: "prev", value: shortRepr(prev.value, 16), color: "text-sky-300 border-sky-500/40 bg-sky-500/8" },
    curr && { label: "curr", value: shortRepr(curr.value, 16), color: "text-violet-300 border-violet-500/40 bg-violet-500/8" },
    nxt  && { label: "next", value: shortRepr(nxt.value, 16),  color: "text-emerald-300 border-emerald-500/40 bg-emerald-500/8" },
  ].filter(Boolean) as { label: string; value: string; color: string }[];

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        linked list · pointers
      </div>
      <div className="flex flex-col gap-1.5 p-2.5">
        {/* pointer chain visual */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {pointers.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              <div className={`rounded border px-2.5 py-1.5 font-mono text-[11px] ${p.color}`}>
                <div className="text-[9px] opacity-60 mb-0.5">{p.label}</div>
                <div className="font-medium">{p.value}</div>
              </div>
              {i < pointers.length - 1 && <span className="text-muted-foreground/30 text-sm">→</span>}
            </div>
          ))}
        </div>
        {/* depth / traversal info */}
        <div className="text-[10px] text-muted-foreground">
          stack depth <span className="font-mono text-foreground/60">{snap.stack.length}</span>
          {snap.event === "return" && snap.returnValue && (
            <> · returns <span className="font-mono text-emerald-400">{shortRepr(snap.returnValue, 16)}</span></>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NESTED LOOP / ITERATIVE visualizer ───────────────────────────────────────

function IterativeViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const loopVars = frame.locals.filter((v) =>
    (v.value.kind === "int") &&
    /^[ijk]$|^(idx|index|row|col|count|n|x|y)$/.test(v.name)
  );
  const arrVars = frame.locals.filter((v) =>
    v.value.kind === "list" && v.value.items && v.value.items.length > 0
  );

  if (loopVars.length === 0 && arrVars.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        loop state
      </div>
      <div className="p-2.5 flex flex-col gap-2">
        {loopVars.length > 0 && (
          <div className="flex gap-3">
            {loopVars.map((v) => (
              <div key={v.name} className="rounded border border-cyan-500/30 bg-cyan-500/8 px-3 py-1.5 text-center">
                <div className="text-[9px] text-muted-foreground mb-0.5">{v.name}</div>
                <div className="font-mono text-sm font-semibold text-cyan-300">{shortRepr(v.value, 8)}</div>
              </div>
            ))}
          </div>
        )}
        {arrVars.slice(0, 2).map((v) => {
          const items = v.value.items!;
          const curIdx = Number(frame.locals.find((l) => /^[ij]$|^idx|^index/.test(l.name))?.value.value ?? -1);
          return (
            <div key={v.name} className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground">{v.name}</span>
              <div className="flex gap-1 flex-wrap">
                {items.slice(0, 16).map((item, idx) => (
                  <div key={idx} className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition-all duration-150 ${
                    idx === curIdx
                      ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                      : "border-border/30 bg-muted/30 text-muted-foreground/50"
                  }`}>
                    {shortRepr(item, 6)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── auto viz picker ───────────────────────────────────────────────────────────

function AutoViz({ kind, snapshots, step }: { kind: AlgoKind; snapshots: Snapshot[]; step: number }) {
  switch (kind) {
    case "sort":           return <SortViz snapshots={snapshots} step={step} />;
    case "recursion":      return <RecursionViz snapshots={snapshots} step={step} />;
    case "binary-search":  return <BinarySearchViz snapshots={snapshots} step={step} />;
    case "bfs":
    case "dfs":            return <GraphViz snapshots={snapshots} step={step} />;
    case "tree":           return <TreeViz snapshots={snapshots} step={step} />;
    case "linked-list":    return <LinkedListViz snapshots={snapshots} step={step} />;
    case "nested-loop":
    case "iterative":      return <IterativeViz snapshots={snapshots} step={step} />;
    default:               return null;
  }
}

// ── main panel ────────────────────────────────────────────────────────────────

export function ExplainPanel() {
  const snapshots    = useExecutionStore((s) => s.snapshots);
  const code         = useExecutionStore((s) => s.code);
  const currentStep  = useExecutionStore((s) => s.currentStep);
  const result       = useExecutionStore((s) => s.result);

  const hasTrace  = snapshots.length > 0;
  const error     = result?.error ?? null;
  const complexity = result?.complexity;

  const summary = useMemo(
    () => (hasTrace ? classifyProgram(code, snapshots, complexity) : null),
    [snapshots, code, hasTrace, complexity]
  );

  const explanations = useMemo(
    () => (hasTrace ? narrateAll(snapshots, code, summary?.kind) : []),
    [snapshots, code, hasTrace, summary?.kind]
  );

  if (!hasTrace && !error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-xs">
          <Lightbulb className="mx-auto mb-3 size-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Press <span className="font-medium text-foreground">Run</span> — RunX auto-detects
            the algorithm and shows it step by step.
          </p>
        </div>
      </div>
    );
  }

  const current  = explanations[currentStep];
  const prevSnap = snapshots[currentStep - 1];
  const currSnap = snapshots[currentStep];

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2.5 p-3">

        {/* error */}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
              <TriangleAlert className="size-4" />
              {error.type}
              {error.line != null && (
                <span className="font-mono text-xs font-normal opacity-70">· line {error.line}</span>
              )}
            </div>
            <p className="mt-1 font-mono text-xs text-destructive/80 whitespace-pre-wrap">{error.message}</p>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {explainException(error.type, error.message).hint}
            </p>
          </div>
        )}

        {/* algo badge */}
        {summary && (
          <AlgoBadge kind={summary.kind} complexity={summary.complexity} />
        )}

        {/* AUTO VISUALIZATION — live updates with every step */}
        {summary && (
          <AutoViz kind={summary.kind} snapshots={snapshots} step={currentStep} />
        )}

        {/* current step card */}
        {current && (
          <div className="rounded-md border border-border/50 bg-card/60 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full border border-border/50 bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                line {current.line}
              </span>
              <KindPill kind={current.kind} />
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/40">
                {currentStep + 1} / {explanations.length}
              </span>
            </div>
            {current.detail && (
              <pre className="overflow-x-auto rounded bg-muted/40 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground/80 whitespace-pre-wrap">
                {current.detail}
              </pre>
            )}
            <StepValues values={current.values} />
            <StepChanges key={currentStep} changes={current.changes} />
          </div>
        )}

        {/* variable diff — live */}
        <VariableDiff prev={prevSnap} curr={currSnap} />

      </div>
    </ScrollArea>
  );
}
