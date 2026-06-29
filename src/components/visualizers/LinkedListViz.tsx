"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

function getNodeVal(v: ValueNode | undefined): string {
  if (!v) return "null";
  if (v.kind === "none") return "null";
  if (v.kind === "object" && v.attributes) {
    const val = v.attributes.find((a) => ["val","value","data"].includes(a.name));
    if (val) return shortRepr(val.value, 5);
  }
  return shortRepr(v, 6);
}

export function LinkedListViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap  = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  const curr = frame.locals.find((v) => ["curr","current","node","ptr","p"].includes(v.name));
  const head = frame.locals.find((v) => v.name === "head");
  const prev = frame.locals.find((v) => v.name === "prev");
  const nxt  = frame.locals.find((v) => v.name === "next");
  const slow = frame.locals.find((v) => v.name === "slow");
  const fast = frame.locals.find((v) => v.name === "fast");

  if (!curr && !head) return null;

  // Build pointer display list
  const pointers = [
    head && { label: "head", value: getNodeVal(head.value), raw: shortRepr(head.value,14), color: "#EF9F27", bg: "#3D2A00", stroke: "#EF9F27" },
    prev && { label: "prev", value: getNodeVal(prev.value), raw: shortRepr(prev.value,14), color: "#93C5FD", bg: "#0C2040", stroke: "#3B82F6" },
    curr && { label: "curr", value: getNodeVal(curr.value), raw: shortRepr(curr.value,14), color: "#C4C0F5", bg: "#2D2A5A", stroke: "#9B96E8" },
    nxt  && { label: "next", value: getNodeVal(nxt.value),  raw: shortRepr(nxt.value,14),  color: "#6EE7B7", bg: "#0A3028", stroke: "#1D9E75" },
    slow && { label: "slow", value: getNodeVal(slow.value), raw: shortRepr(slow.value,14), color: "#FCA5A5", bg: "#3D1010", stroke: "#DC2626" },
    fast && { label: "fast", value: getNodeVal(fast.value), raw: shortRepr(fast.value,14), color: "#FCD34D", bg: "#3D2A00", stroke: "#F59E0B" },
  ].filter(Boolean) as { label: string; value: string; raw: string; color: string; bg: string; stroke: string }[];

  if (pointers.length === 0) return null;

  const W = 300, H = 80;
  const boxW = Math.min(60, Math.floor((W - 20) / pointers.length) - 8);
  const boxH = 42;
  const totalW = pointers.length * (boxW + 12) - 12;
  const startX = (W - totalW) / 2;
  const y = (H - boxH) / 2;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        linked list · pointers
      </div>

      <div className="bg-[#0d0d1a] flex justify-center">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {pointers.map((p, i) => {
            const x = startX + i * (boxW + 12);
            const isNull = p.value === "null";
            return (
              <g key={i}>
                {/* arrow between boxes */}
                {i < pointers.length - 1 && (
                  <g>
                    <line x1={x + boxW} y1={y + boxH/2} x2={x + boxW + 12} y2={y + boxH/2}
                      stroke="#2a2a4a" strokeWidth={1.5} />
                    <polygon points={`${x+boxW+10},${y+boxH/2-3} ${x+boxW+14},${y+boxH/2} ${x+boxW+10},${y+boxH/2+3}`}
                      fill="#2a2a4a" />
                  </g>
                )}

                {/* node box */}
                <rect x={x} y={y} width={boxW} height={boxH} rx={5}
                  fill={isNull ? "#0d0d1a" : p.bg}
                  stroke={isNull ? "#2a2a3a" : p.stroke}
                  strokeWidth={1.5} strokeDasharray={isNull ? "3 2" : undefined} />

                {/* label */}
                <text x={x + boxW/2} y={y + 11} textAnchor="middle"
                  fontSize={8} fontFamily="var(--font-mono)" fill={p.color} opacity={0.8}>
                  {p.label}
                </text>

                {/* value */}
                <text x={x + boxW/2} y={y + 27} textAnchor="middle"
                  fontSize={11} fontFamily="var(--font-mono)" fontWeight="700"
                  fill={isNull ? "#333355" : p.color}>
                  {p.value}
                </text>

                {/* null indicator */}
                {isNull && (
                  <text x={x + boxW/2} y={y + 38} textAnchor="middle"
                    fontSize={7} fontFamily="var(--font-mono)" fill="#333355">
                    NULL
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* raw values */}
      <div className="flex flex-wrap gap-1.5 border-t border-border/40 p-2">
        {pointers.map((p) => (
          <div key={p.label} className="rounded border px-2 py-1" style={{ borderColor: p.stroke + "44", backgroundColor: p.bg + "88" }}>
            <span className="font-mono text-[9px]" style={{ color: p.color }}>{p.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground ml-1">{p.raw}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border/40 px-3 py-1 text-[10px] text-muted-foreground">
        stack depth <span className="font-mono text-foreground/50">{snap.stack.length}</span>
        {snap.event === "return" && snap.returnValue && (
          <> · returns <span className="font-mono text-emerald-400">{shortRepr(snap.returnValue, 14)}</span></>
        )}
      </div>
    </div>
  );
}
