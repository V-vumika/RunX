"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";
import { shortRepr } from "@/lib/explain/narrate";

function as1D(node: ValueNode | undefined): (string | null)[] | null {
  if (!node || node.kind !== "list" || !node.items) return null;
  if (node.items.some((i) => i.kind === "list")) return null;
  return node.items.map((i) =>
    i.kind === "none" || i.repr === "None" ? null : shortRepr(i, 6)
  );
}

function as2D(node: ValueNode | undefined): (string | null)[][] | null {
  if (!node || node.kind !== "list" || !node.items) return null;
  if (!node.items.every((r) => r.kind === "list")) return null;
  return node.items.map((r) =>
    (r.items ?? []).map((c) =>
      c.kind === "none" || c.repr === "None" ? null : shortRepr(c, 6)
    )
  );
}

interface RecNode {
  id: string;
  n: number;
  children: RecNode[];
  computed: boolean;
  isBase: boolean;
  val: string | null;
}

let _rid = 0;
function buildRecTree(
  n: number,
  dp: (string | null)[],
  depth: number,
  maxDepth: number,
  memo: Map<string, RecNode>
): RecNode {
  const key = `${n}-${depth}`;
  if (memo.has(key)) return memo.get(key)!;
  _rid++;
  const id = `n${_rid}`;
  const computed = dp[n] !== null && dp[n] !== undefined;
  const isBase = n <= 1;
  const node: RecNode = {
    id,
    n,
    children: [],
    computed,
    isBase,
    val: computed ? dp[n]! : null,
  };
  memo.set(key, node);
  if (!isBase && depth < maxDepth) {
    node.children = [
      buildRecTree(n - 1, dp, depth + 1, maxDepth, memo),
      buildRecTree(n - 2, dp, depth + 1, maxDepth, memo),
    ];
  }
  return node;
}

interface NodePos { x: number; y: number; node: RecNode }

function layoutTree(
  root: RecNode,
  x: number,
  y: number,
  spread: number,
  out: NodePos[] = []
): NodePos[] {
  out.push({ x, y, node: root });
  if (root.children.length === 2) {
    layoutTree(root.children[0], x - spread, y + 52, spread * 0.55, out);
    layoutTree(root.children[1], x + spread, y + 52, spread * 0.55, out);
  }
  return out;
}

function collectEdges(
  root: RecNode,
  x: number,
  y: number,
  spread: number,
  out: { x1:number; y1:number; x2:number; y2:number; dep:boolean }[] = []
): typeof out {
  if (root.children.length === 2) {
    const lx = x - spread, ly = y + 52;
    const rx = x + spread, ry = y + 52;
    out.push({ x1: x, y1: y, x2: lx, y2: ly, dep: root.children[0].computed });
    out.push({ x1: x, y1: y, x2: rx, y2: ry, dep: root.children[1].computed });
    collectEdges(root.children[0], lx, ly, spread * 0.55, out);
    collectEdges(root.children[1], rx, ry, spread * 0.55, out);
  }
  return out;
}

export function DPTableViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap  = snapshots[step];
  const frame = snap?.stack.at(-1);
  if (!frame) return null;

  // find dp/memo array
  const allLocals = snap.stack.flatMap((f) => f.locals);
  const dpVar = allLocals.find((v) => /^(dp|memo|cache|table)$/.test(v.name));
  if (!dpVar) return null;

  const arr1D = as1D(dpVar.value);
  const arr2D = as2D(dpVar.value);

  // current i/n
  const iVar = frame.locals.find((v) => ["n", "i", "idx"].includes(v.name));
  const iVal = iVar ? Number(iVar.value.value ?? -1) : -1;

  const W = 560, H_TABLE = 60, H_TREE = 260;

  // ── 1D DP (e.g. fibonacci) ───────────────────────────────────────────────
  if (arr1D) {
    const count = Math.min(arr1D.length, 20);
    const cellW = Math.max(28, Math.floor((W - 60) / count));

    // build recursion tree if n is small enough
    _rid = 0;
    const showTree = iVal >= 0 && iVal <= 12 && arr1D.length <= 15;
    const treeRoot = showTree
      ? buildRecTree(iVal, arr1D, 0, 4, new Map())
      : null;
    const treePositions = treeRoot
      ? layoutTree(treeRoot, W / 2, 30, 120)
      : [];
    const treeEdges = treeRoot
      ? collectEdges(treeRoot, W / 2, 30, 120)
      : [];

    // current computation label
    const prevVal  = iVal >= 2 && arr1D[iVal - 1] != null ? arr1D[iVal - 1] : null;
    const prev2Val = iVal >= 2 && arr1D[iVal - 2] != null ? arr1D[iVal - 2] : null;
    const curVal   = arr1D[iVal] ?? null;

    return (
      <div style={{ background: "#0d0d18", borderRadius: 10, overflow: "hidden", fontFamily: "var(--font-mono)" }}>

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 6px", borderBottom: "1px solid #1e1e35" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#c4c0f5", marginBottom: 2 }}>DP Table (Memoization)</div>
            <div style={{ fontSize: 10, color: "#555577" }}>Each cell represents {dpVar.name}[n]</div>
          </div>
          {iVal >= 0 && (
            <div style={{ background: "#2D2A5A", border: "1px solid #7F77DD", borderRadius: 6, padding: "4px 12px", fontSize: 11, color: "#c4c0f5", fontWeight: 600 }}>
              Depth: {snap.stack.length}
            </div>
          )}
        </div>

        {/* 1D table */}
        <div style={{ padding: "10px 16px 6px", overflowX: "auto" }}>
          <svg width={60 + count * cellW} height={H_TABLE} viewBox={`0 0 ${60 + count * cellW} ${H_TABLE}`}>
            {/* row label */}
            <text x={0} y={22} fontSize={10} fontFamily="var(--font-mono)" fill="#555577">{dpVar.name}(n)</text>
            <text x={0} y={50} fontSize={10} fontFamily="var(--font-mono)" fill="#555577">index</text>

            {arr1D.slice(0, count).map((val, idx) => {
              const isActive  = idx === iVal;
              const isDep     = !isActive && (idx === iVal - 1 || idx === iVal - 2);
              const isComputed = val !== null && !isActive;
              const isBase    = idx <= 1;

              const fill   = isActive ? "#3D1F7A"
                           : isDep    ? "#3D2200"
                           : isBase   ? "#0C2A5A"
                           : isComputed ? "#0F3D2E"
                           : "#12122a";
              const stroke = isActive ? "#9B96E8"
                           : isDep    ? "#EF9F27"
                           : isBase   ? "#3B82F6"
                           : isComputed ? "#1D9E75"
                           : "#2a2a4a";
              const tc     = isActive ? "#c4c0f5"
                           : isDep    ? "#FCD34D"
                           : isBase   ? "#93C5FD"
                           : isComputed ? "#6EE7B7"
                           : "#333355";

              const x = 54 + idx * cellW;
              return (
                <g key={idx}>
                  {/* index row */}
                  <text x={x + (cellW - 4) / 2} y={50} textAnchor="middle"
                    fontSize={9} fontFamily="var(--font-mono)"
                    fill={isActive ? "#9B96E8" : isDep ? "#EF9F27" : "#444466"}>{idx}</text>

                  {/* value cell */}
                  <rect x={x} y={10} width={cellW - 4} height={28} rx={5}
                    fill={fill} stroke={stroke} strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={!isComputed && !isActive ? "4 2" : undefined} />
                  <text x={x + (cellW - 4) / 2} y={28} textAnchor="middle"
                    fontSize={11} fontFamily="var(--font-mono)" fontWeight="700" fill={tc}>
                    {val ?? "?"}
                  </text>
                  {isActive && (
                    <rect x={x - 1} y={9} width={cellW - 2} height={30} rx={6}
                      fill="none" stroke="#9B96E8" strokeWidth={0.5} strokeOpacity={0.4}
                      strokeDasharray="3 2" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* current computation formula */}
        {iVal >= 2 && (
          <div style={{ margin: "0 16px 8px", background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 6, padding: "8px 14px", fontSize: 11 }}>
            <span style={{ color: "#888" }}>Computing </span>
            <span style={{ color: "#c4c0f5" }}>{dpVar.name}[{iVal}]</span>
            <span style={{ color: "#888" }}> = </span>
            <span style={{ color: "#EF9F27" }}>{dpVar.name}[{iVal-1}]</span>
            <span style={{ color: "#888" }}> + </span>
            <span style={{ color: "#EF9F27" }}>{dpVar.name}[{iVal-2}]</span>
            {prevVal && prev2Val && (
              <>
                <span style={{ color: "#888" }}> = </span>
                <span style={{ color: "#EF9F27" }}>{prevVal}</span>
                <span style={{ color: "#888" }}> + </span>
                <span style={{ color: "#EF9F27" }}>{prev2Val}</span>
              </>
            )}
            {curVal && (
              <>
                <span style={{ color: "#888" }}> = </span>
                <span style={{ color: "#1D9E75", fontWeight: 700 }}>{curVal}</span>
              </>
            )}
          </div>
        )}

        {/* recursion tree */}
        {treeRoot && treePositions.length > 0 && (
          <div style={{ overflowX: "auto", background: "#0a0a15", borderTop: "1px solid #1e1e35", paddingBottom: 8 }}>
            <svg width={W} height={H_TREE} viewBox={`0 0 ${W} ${H_TREE}`}>
              {treeEdges.map((e, idx) => (
                <g key={idx}>
                  <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                    stroke={e.dep ? "#1D9E75" : "#333355"} strokeWidth={1.5}
                    strokeOpacity={0.6} markerEnd="url(#arr)" />
                </g>
              ))}
              <defs>
                <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#555577" />
                </marker>
              </defs>
              {treePositions.map(({ x, y, node }) => {
                const isActive   = node.n === iVal && node === treeRoot;
                const isDep      = !isActive && (node.n === iVal - 1 || node.n === iVal - 2) && node.children.length > 0;
                const isComputed = node.computed && !isActive && !isDep;
                const isBase     = node.isBase;
                const fill   = isActive ? "#3D1F7A"
                             : isDep    ? "#3D2200"
                             : isBase   ? "#0C2A5A"
                             : isComputed ? "#0F3D2E"
                             : "#12122a";
                const stroke = isActive ? "#9B96E8"
                             : isDep    ? "#EF9F27"
                             : isBase   ? "#3B82F6"
                             : isComputed ? "#1D9E75"
                             : "#2a2a4a";
                const tc     = isActive ? "#c4c0f5"
                             : isDep    ? "#FCD34D"
                             : isBase   ? "#93C5FD"
                             : isComputed ? "#6EE7B7"
                             : "#555577";
                return (
                  <g key={node.id}>
                    {isActive && <circle cx={x} cy={y} r={19} fill="#9B96E8" opacity={0.12} />}
                    <rect x={x - 15} y={y - 15} width={30} height={30} rx={7}
                      fill={fill} stroke={stroke} strokeWidth={isActive ? 2 : 1.5} />
                    <text x={x} y={y + 5} textAnchor="middle"
                      fontSize={11} fontFamily="var(--font-mono)" fontWeight="700" fill={tc}>
                      {node.n}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* legend */}
        <div style={{ display: "flex", gap: 14, padding: "6px 16px 10px", flexWrap: "wrap" }}>
          {[
            { color: "#9B96E8", label: "Current Cell" },
            { color: "#EF9F27", label: "Dependency" },
            { color: "#1D9E75", label: "Computed" },
            { color: "#3B82F6", label: "Base Case" },
            { color: "#333355", label: "Uncomputed" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#555577" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>

      </div>
    );
  }

  // ── 2D DP (e.g. LCS, knapsack) ───────────────────────────────────────────
  if (arr2D) {
    const rows = arr2D.length;
    const cols = Math.max(...arr2D.map((r) => r.length));
    const iVal2 = frame.locals.find((v) => v.name === "i") ? Number(frame.locals.find((v) => v.name === "i")!.value.value ?? -1) : -1;
    const jVal  = frame.locals.find((v) => v.name === "j") ? Number(frame.locals.find((v) => v.name === "j")!.value.value ?? -1) : -1;
    const cell  = Math.max(24, Math.min(36, Math.floor((W - 48) / cols)));
    const svgW  = 40 + cols * cell, svgH = 26 + rows * cell;

    return (
      <div style={{ background: "#0d0d18", borderRadius: 10, overflow: "hidden", fontFamily: "var(--font-mono)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 6px", borderBottom: "1px solid #1e1e35" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#c4c0f5", marginBottom: 2 }}>DP Table (2D)</div>
            <div style={{ fontSize: 10, color: "#555577" }}>{rows}×{cols} grid · {dpVar.name}[i][j]</div>
          </div>
          {iVal2 >= 0 && jVal >= 0 && (
            <div style={{ fontSize: 10, color: "#9B96E8" }}>i={iVal2} · j={jVal}</div>
          )}
        </div>
        <div style={{ padding: "10px 16px", overflowX: "auto" }}>
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
            {/* column headers */}
            {Array.from({ length: cols }).map((_, c) => (
              <text key={c} x={40 + c * cell + cell / 2} y={14} textAnchor="middle"
                fontSize={9} fontFamily="var(--font-mono)"
                fill={c === jVal ? "#9B96E8" : "#444466"}>{c}</text>
            ))}
            {arr2D.map((row, r) => (
              <g key={r}>
                <text x={18} y={24 + r * cell + cell / 2 + 4} textAnchor="middle"
                  fontSize={9} fontFamily="var(--font-mono)"
                  fill={r === iVal2 ? "#9B96E8" : "#444466"}>{r}</text>
                {row.map((val, c) => {
                  const isActive   = r === iVal2 && c === jVal;
                  const isRowOrCol = (r === iVal2 || c === jVal) && !isActive;
                  const isComputed = val !== null;
                  const x = 30 + c * cell, y = 18 + r * cell;
                  const fill   = isActive ? "#3D1F7A" : isRowOrCol ? "#1a1a35" : isComputed ? "#0F3D2E" : "#12122a";
                  const stroke = isActive ? "#9B96E8" : isRowOrCol ? "#3a3a6a" : isComputed ? "#1D9E75" : "#2a2a4a";
                  const tc     = isActive ? "#c4c0f5" : isComputed ? "#6EE7B7" : "#333355";
                  return (
                    <g key={c}>
                      <rect x={x + 1} y={y + 1} width={cell - 4} height={cell - 4} rx={4}
                        fill={fill} stroke={stroke} strokeWidth={isActive ? 2 : 1} />
                      <text x={x + cell / 2} y={y + cell / 2 + 4} textAnchor="middle"
                        fontSize={10} fontFamily="var(--font-mono)" fontWeight={isActive ? "700" : "400"} fill={tc}>
                        {val ?? "·"}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </div>
        <div style={{ display: "flex", gap: 14, padding: "4px 16px 10px", flexWrap: "wrap" }}>
          {[
            { color: "#9B96E8", label: "Current" },
            { color: "#1D9E75", label: "Computed" },
            { color: "#333355", label: "Uncomputed" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#555577" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />{l.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
