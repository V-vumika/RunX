"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";
import { VIZ } from "@/lib/visualizers/palette";

interface TNode { val: string; left?: TNode; right?: TNode; id: number }
interface Pos { x: number; y: number; node: TNode }

function parseTree(node: ValueNode | undefined | null, counter: { n: number }, depth = 0): TNode | undefined {
  if (!node || node.kind === "none" || depth > 7) return undefined;
  const id = ++counter.n;

  if (node.kind === "object" && node.attributes) {
    const v = node.attributes.find((a) => ["val","value","data","key"].includes(a.name));
    const l = node.attributes.find((a) => a.name === "left");
    const r = node.attributes.find((a) => a.name === "right");
    if (v) return { id, val: shortRepr(v.value, 4), left: parseTree(l?.value, counter, depth+1), right: parseTree(r?.value, counter, depth+1) };
  }
  if (node.kind === "dict" && node.entries) {
    const v = node.entries.find((e) => ["val","value","data","key"].includes(String(e.key.value)));
    const l = node.entries.find((e) => e.key.value === "left");
    const r = node.entries.find((e) => e.key.value === "right");
    if (v) return { id, val: shortRepr(v.value, 4), left: parseTree(l?.value, counter, depth+1), right: parseTree(r?.value, counter, depth+1) };
  }
  if (node.kind === "int" || node.kind === "str" || node.kind === "float") return { id, val: shortRepr(node, 4) };
  return undefined;
}

function layout(root: TNode | undefined, x: number, y: number, spread: number, out: Pos[] = []): Pos[] {
  if (!root) return out;
  out.push({ x, y, node: root });
  if (root.left)  layout(root.left,  x - spread, y + 46, spread / 2, out);
  if (root.right) layout(root.right, x + spread, y + 46, spread / 2, out);
  return out;
}

function edges(root: TNode | undefined, x: number, y: number, spread: number,
  out: { px:number; py:number; cx:number; cy:number; id:string }[] = []) {
  if (!root) return out;
  if (root.left) {
    out.push({ px:x, py:y, cx:x-spread, cy:y+46, id:`${root.id}-l` });
    edges(root.left,  x-spread, y+46, spread/2, out);
  }
  if (root.right) {
    out.push({ px:x, py:y, cx:x+spread, cy:y+46, id:`${root.id}-r` });
    edges(root.right, x+spread, y+46, spread/2, out);
  }
  return out;
}

export function TreeViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  if (!snap) return null;

  const allLocals  = snap.stack.flatMap((f) => f.locals);
  const rootVar    = allLocals.find((v) => v.name === "root") ??
                     snap.stack.at(-1)?.locals.find((v) => ["node","curr","tree"].includes(v.name));
  const currFrame  = snap.stack.at(-1);
  const currVar    = currFrame?.locals.find((v) => ["node","curr"].includes(v.name));
  const currentVal = currVar ? shortRepr(currVar.value, 4) : null;

  // track visited from call stack
  const visitedVals = new Set<string>();
  snap.stack.forEach((f) => {
    const nv = f.locals.find((v) => ["node","curr","root"].includes(v.name));
    if (nv && nv.value.kind !== "none") visitedVals.add(shortRepr(nv.value, 4));
  });

  const counter = { n: 0 };
  const root = parseTree(rootVar?.value, counter);

  if (!root) {
    // depth chain fallback
    return (
      <div className="overflow-hidden rounded-md border border-border/50">
        <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          tree traversal · depth {snap.stack.length}
        </div>
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {snap.stack.map((f, i) => {
              const isActive = i === snap.stack.length - 1;
              const nv = f.locals.find((v) => ["node","root","curr","val"].includes(v.name));
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className="flex h-7 min-w-7 items-center justify-center rounded-full border px-1.5 font-mono text-[10px] font-semibold"
                    style={
                      isActive
                        ? { borderColor: VIZ.activeBorder, background: VIZ.activeFill, color: VIZ.activeText }
                        : { borderColor: VIZ.idleBorder, background: VIZ.idleFill, color: VIZ.idleTextFaint }
                    }
                  >{nv ? shortRepr(nv.value, 4) : i+1}</div>
                  {i < snap.stack.length-1 && <span className="text-muted-foreground/25 text-xs">›</span>}
                </div>
              );
            })}
          </div>
          {currVar && (
            <div
              className="flex items-center gap-2 rounded border px-2.5 py-1.5"
              style={{ borderColor: VIZ.activeFill, background: "rgba(102,58,243,0.06)" }}
            >
              <span className="text-[10px] text-muted-foreground">current node</span>
              <span className="font-mono text-[11px] font-medium" style={{ color: VIZ.activeText }}>{shortRepr(currVar.value, 20)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const W = 300, startX = 150, startY = 24, initSpread = 64;
  const positions = layout(root, startX, startY, initSpread);
  const edgeList  = edges(root, startX, startY, initSpread);
  const maxY = Math.max(...positions.map((p) => p.y)) + 28;
  const H = Math.max(120, maxY);
  const nodeR = 14;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        binary tree · {positions.length} nodes
      </div>

      <div className="flex justify-center" style={{ background: VIZ.canvasBg }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* subtle grid */}
          {Array.from({length:5}).map((_,row) => Array.from({length:7}).map((_,col) => (
            <circle key={`${row}-${col}`} cx={col*50+10} cy={row*30+10} r={1} fill="#fff" opacity={0.03} />
          )))}

          {/* edges */}
          {edgeList.map((e) => (
            <line key={e.id} x1={e.px} y1={e.py} x2={e.cx} y2={e.cy}
              stroke={VIZ.idleLine} strokeWidth={1.5} />
          ))}

          {/* nodes */}
          {positions.map(({ x, y, node }) => {
            const isCurrent = node.val === currentVal;
            const isVisited = visitedVals.has(node.val) && !isCurrent;
            const fill   = isCurrent ? VIZ.activeFill : isVisited ? VIZ.doneFill : VIZ.idleFill;
            const stroke = isCurrent ? VIZ.activeBorder : isVisited ? VIZ.doneBorder : VIZ.idleBorder;
            const tc     = isCurrent ? VIZ.activeText : isVisited ? VIZ.doneText : VIZ.idleTextFaint;

            return (
              <g key={node.id}>
                {isCurrent && <>
                  <circle cx={x} cy={y} r={nodeR+7} fill={VIZ.activeBar} opacity={0.12} />
                  <circle cx={x} cy={y} r={nodeR+4} fill="none" stroke={VIZ.activeBorder}
                    strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.6} />
                </>}
                {isVisited && <circle cx={x} cy={y} r={nodeR+4} fill={VIZ.doneBar} opacity={0.1} />}
                <circle cx={x} cy={y} r={nodeR} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text x={x} y={y+4} textAnchor="middle"
                  fontSize={10} fontFamily="var(--font-mono)" fontWeight="700" fill={tc}>
                  {node.val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-3 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: VIZ.activeBar }} />current</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: VIZ.doneBar }} />visited</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border" style={{ borderColor: VIZ.idleBorder, background: VIZ.idleFill }} />unvisited</span>
      </div>
    </div>
  );
}
