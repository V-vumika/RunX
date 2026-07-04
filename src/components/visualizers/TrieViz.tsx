"use client";

import { useEffect, useRef } from "react";
import type { Snapshot, ValueNode } from "@/types/snapshot";

// ── trie node (our internal representation) ───────────────────────────────────

interface TNode { id: number; ch: string; isEnd: boolean; children: Map<string, TNode> }

let _nid = 0;
function mk(ch: string): TNode { return { id: _nid++, ch, isEnd: false, children: new Map() }; }

// ── parse ValueNode tree into TNode tree ──────────────────────────────────────

function getAttr(node: ValueNode, name: string): ValueNode | undefined {
  return node.attributes?.find(a => a.name === name)?.value;
}

function parseTrieNode(vnode: ValueNode | undefined, counter: { n: number }, depth = 0): TNode | undefined {
  if (!vnode || vnode.kind === "none" || depth > 20) return undefined;
  const id = counter.n++;
  const tnode: TNode = { id, ch: "•", isEnd: false, children: new Map() };

  // get is_end / isEnd
  const isEndAttr = getAttr(vnode, "is_end") ?? getAttr(vnode, "isEnd") ?? getAttr(vnode, "end_of_word");
  if (isEndAttr) tnode.isEnd = isEndAttr.value === true || isEndAttr.repr === "True";

  // get children dict
  const childrenAttr = getAttr(vnode, "children") ?? getAttr(vnode, "kids");
  if (childrenAttr?.kind === "dict" && childrenAttr.entries) {
    for (const { key, value } of childrenAttr.entries) {
      const ch = String(key.value ?? key.repr ?? "").replace(/^['"]|['"]$/g, "");
      if (!ch) continue;
      const child = parseTrieNode(value, counter, depth + 1);
      if (child) { child.ch = ch; tnode.children.set(ch, child); }
    }
  }

  return tnode;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function countNodes(n: TNode): number { let c = 1; n.children.forEach(ch => c += countNodes(ch)); return c; }
function treeHeight(n: TNode): number { if (!n.children.size) return 1; let mx = 0; n.children.forEach(ch => { const h = treeHeight(ch); if (h > mx) mx = h; }); return mx + 1; }
function countEnd(n: TNode): number { let c = n.isEnd ? 1 : 0; n.children.forEach(ch => c += countEnd(ch)); return c; }
function avgBranch(n: TNode): string { let total = 0, cnt = 0; function dfs(x: TNode) { if (x.children.size) { total += x.children.size; cnt++; } x.children.forEach(dfs); } dfs(n); return cnt ? (total / cnt).toFixed(2) : "0"; }

// ── layout ────────────────────────────────────────────────────────────────────

interface Pos { x: number; y: number; node: TNode }
interface Edge { x1: number; y1: number; x2: number; y2: number; ch: string; mx: number; my: number }

function layout(node: TNode, x: number, y: number, spread: number, out: Pos[] = []): Pos[] {
  out.push({ x, y, node });
  const kids = [...node.children.entries()];
  if (!kids.length) return out;
  const tot = (kids.length - 1) * spread;
  kids.forEach(([, child], i) => layout(child, x - tot / 2 + i * spread, y + 56, Math.max(spread * 0.6, 28), out));
  return out;
}

function getEdges(node: TNode, x: number, y: number, spread: number, out: Edge[] = []): Edge[] {
  const kids = [...node.children.entries()];
  if (!kids.length) return out;
  const tot = (kids.length - 1) * spread;
  kids.forEach(([ch, child], i) => {
    const cx = x - tot / 2 + i * spread, cy = y + 56;
    out.push({ x1: x, y1: y, x2: cx, y2: cy, ch, mx: (x + cx) / 2, my: (y + cy) / 2 });
    getEdges(child, cx, cy, Math.max(spread * 0.6, 28), out);
  });
  return out;
}

// ── canvas draw ───────────────────────────────────────────────────────────────

const R = 15;

function drawTrie(
  canvas: HTMLCanvasElement,
  root: TNode,
  pathIds: Set<number>,
  curId: number,
  failed: boolean
) {
  const W = canvas.parentElement?.clientWidth || 560;
  const pos = layout(root, W / 2, 30, 110);
  const edg = getEdges(root, W / 2, 30, 110);
  const maxY = Math.max(...pos.map(p => p.y)) + 34;
  const H = Math.max(180, maxY);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  const posById = new Map(pos.map(p => [p.node.id, p]));

  edg.forEach(e => {
    const dx = e.x2 - e.x1, dy = (e.y2 - R) - (e.y1 + R);
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const sx = e.x1 + ux * R, sy = e.y1 + R;
    const ex = e.x2 - ux * R, ey = e.y2 - R;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
    ctx.strokeStyle = "#3a3a6a"; ctx.lineWidth = 1.5; ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(ex - uy * 3, ey + ux * 3);
    ctx.lineTo(ex + ux * 5, ey + uy * 5);
    ctx.lineTo(ex + uy * 3, ey - ux * 3);
    ctx.fillStyle = "#555577"; ctx.fill();
    // edge label
    const lx = (e.x1 + e.x2) / 2 + (e.x2 > e.x1 ? 9 : -9);
    ctx.fillStyle = "#888"; ctx.font = "10px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText(e.ch, lx, (e.y1 + e.y2) / 2);
  });

  pos.forEach(({ x, y, node }) => {
    const isRoot = node === root;
    const isCur  = node.id === curId && pathIds.has(node.id) && !isRoot;
    const isEnd  = node.isEnd && !isRoot;
    const isPath = pathIds.has(node.id) && !isCur && !isRoot;

    const fill   = isRoot ? "#3D1F7A" : (failed && isCur) ? "#3D0808" : isCur ? "#3D2200" : isEnd ? "#0F3D2E" : isPath ? "#0C1A4A" : "#12122a";
    const stroke = isRoot ? "#9B96E8" : (failed && isCur) ? "#DC2626" : isCur ? "#EF9F27" : isEnd ? "#1D9E75" : isPath ? "#3B82F6" : "#2a2a4a";
    const tc     = isRoot ? "#c4c0f5" : (failed && isCur) ? "#FCA5A5" : isCur ? "#FCD34D" : isEnd ? "#6EE7B7" : isPath ? "#93C5FD" : "#8888bb";

    if (isRoot || isCur) {
      ctx.beginPath(); ctx.arc(x, y, R + 7, 0, Math.PI * 2);
      ctx.fillStyle = (isRoot ? "#9B96E8" : "#EF9F27") + "18"; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = isRoot || isCur ? 2 : 1.5; ctx.stroke();
    ctx.fillStyle = tc; ctx.font = "bold 11px 'Courier New'";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(node.id), x, y);
    if (isEnd) {
      ctx.beginPath(); ctx.arc(x + R - 2, y - R + 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#1D9E75"; ctx.fill();
      ctx.strokeStyle = "#0a0a14"; ctx.lineWidth = 1; ctx.stroke();
    }
  });
}

// ── 2D table ──────────────────────────────────────────────────────────────────

function buildTable(root: TNode) {
  const nodes: TNode[] = [], rows = new Map<number, Map<string, string | number>>(), chars = new Set<string>();
  function dfs(n: TNode) {
    nodes.push(n);
    const row = new Map<string, string | number>();
    n.children.forEach((child, ch) => { chars.add(ch); row.set(ch, child.id); dfs(child); });
    if (n.isEnd) { chars.add("\\0"); row.set("\\0", "✓"); }
    rows.set(n.id, row);
  }
  dfs(root);
  return { nodes, chars: [...chars].sort(), rows };
}

// ── main component ────────────────────────────────────────────────────────────

export function TrieViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snap = snapshots[step];
  if (!snap) return null;

  // find root TrieNode from snapshot
  // priority: direct 'root' var > self.root attribute > 't.root' > any object with 'children' attr
  const allLocals = snap.stack.flatMap(f => f.locals);

  let rootVNode: ValueNode | undefined;

  // 1. direct root variable
  const rootVar = allLocals.find(v => v.name === "root" && v.value.kind === "object");
  if (rootVar) rootVNode = rootVar.value;

  // 2. self.root (inside Trie methods)
  if (!rootVNode) {
    const selfVar = allLocals.find(v => v.name === "self");
    if (selfVar) {
      const rootAttr = getAttr(selfVar.value, "root");
      if (rootAttr?.kind === "object") rootVNode = rootAttr;
    }
  }

  // 3. t.root or trie.root (Trie instance variable)
  if (!rootVNode) {
    const trieVar = allLocals.find(v =>
      (v.name === "t" || v.name === "trie") && v.value.kind === "object"
    );
    if (trieVar) {
      const rootAttr = getAttr(trieVar.value, "root");
      if (rootAttr?.kind === "object") rootVNode = rootAttr;
    }
  }

  // 4. any object that has a children dict with single-char keys
  if (!rootVNode) {
    for (const v of allLocals) {
      if (v.value.kind !== "object") continue;
      const ch = getAttr(v.value, "children");
      if (ch?.kind === "dict") { rootVNode = v.value; break; }
    }
  }

  if (!rootVNode) return null;

  // parse into internal TNode tree
  _nid = 0;
  const counter = { n: 0 };
  const root = parseTrieNode(rootVNode, counter);
  if (!root) return null;
  root.ch = "•";

  // current word being processed
  const wordVar = allLocals.find(v => v.name === "word");
  const currentWord = wordVar
    ? String(wordVar.value.value ?? wordVar.value.repr ?? "").replace(/^['"]|['"]$/g, "")
    : "";

  // current node pointer (inside insert/search)
  const nodeVar = allLocals.find(v => v.name === "node" && v.value.kind === "object");

  // build path ids by walking the word so far
  let pathIds = new Set<number>();
  let curId = -1;
  let failed = false;

  if (currentWord) {
    let cur = root;
    pathIds.add(cur.id);
    for (const c of currentWord) {
      if (cur.children.has(c)) { cur = cur.children.get(c)!; pathIds.add(cur.id); }
      else { failed = true; break; }
    }
    curId = cur.id;
  }

  const total = countNodes(root);
  const height = treeHeight(root) - 1;
  const endCount = countEnd(root);
  const ab = avgBranch(root);
  const { nodes, chars, rows } = buildTable(root);

  useEffect(() => {
    if (canvasRef.current) drawTrie(canvasRef.current, root, pathIds, curId, failed);
  });

  return (
    <div style={{ background: "#0d0d1a", borderRadius: 10, overflow: "hidden", fontFamily: "'Courier New', monospace" }}>

      {/* stats header */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1e1e35" }}>
        {[
          { label: "Total Nodes", val: total },
          { label: "Height", val: height },
          { label: "End of Word", val: endCount },
        ].map(s => (
          <div key={s.label} style={{ padding: "10px 18px", borderRight: "1px solid #1e1e35" }}>
            <div style={{ fontSize: 9, color: "#555577", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#c4c0f5" }}>{s.val}</div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 12, padding: "0 14px", marginLeft: "auto", flexWrap: "wrap" }}>
          {[["#9B96E8","Root"],["#EF9F27","Current"],["#1D9E75","End of Word"],["#3B82F6","Intermediate"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#888" }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />{l}
            </div>
          ))}
        </div>
      </div>

      {/* section label */}
      <div style={{ fontSize: 9, color: "#555577", textTransform: "uppercase", letterSpacing: ".08em", padding: "5px 14px", borderBottom: "1px solid #1e1e35" }}>
        Trie Visualization (2D)
      </div>

      {/* canvas */}
      <div style={{ background: "#0a0a14", overflowX: "auto" }}>
        <canvas ref={canvasRef} />
      </div>

      {/* current word indicator */}
      {currentWord && (
        <div style={{ padding: "5px 14px", fontSize: 10, borderTop: "1px solid #1e1e35", background: failed ? "#3D000811" : "#0F3D2E11" }}>
          <span style={{ color: "#555577" }}>word = "</span>
          <span style={{ color: "#EF9F27" }}>{currentWord}</span>
          <span style={{ color: "#555577" }}>" — </span>
          <span style={{ color: failed ? "#DC2626" : "#1D9E75" }}>
            {failed ? "not found in trie" : "path exists"}
          </span>
        </div>
      )}

      {/* 2D table label */}
      <div style={{ fontSize: 9, color: "#555577", textTransform: "uppercase", letterSpacing: ".08em", padding: "5px 14px", borderTop: "1px solid #1e1e35", borderBottom: "1px solid #1e1e35" }}>
        Trie Table (2D View)
      </div>

      {/* table */}
      <div style={{ overflowX: "auto", maxHeight: 200, padding: "0 14px 8px" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 10, fontFamily: "'Courier New', monospace", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ padding: "4px 10px", color: "#9B96E8", textAlign: "left", borderBottom: "1px solid #1e1e35", position: "sticky", top: 0, background: "#0d0d1a" }}>Node</th>
              {chars.map(c => (
                <th key={c} style={{ padding: "4px 10px", color: "#9B96E8", textAlign: "center", borderBottom: "1px solid #1e1e35", position: "sticky", top: 0, background: "#0d0d1a" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.map(n => {
              const isRoot = n === root;
              const isCurRow = n.id === curId && pathIds.has(n.id) && !isRoot;
              const isEndRow = n.isEnd && !isRoot;
              const rowColor = isRoot ? "#9B96E8" : isCurRow ? "#EF9F27" : isEndRow ? "#1D9E75" : "#3B82F6";
              const row = rows.get(n.id) || new Map();
              return (
                <tr key={n.id} style={{ background: isCurRow ? "#3D220022" : "transparent" }}>
                  <td style={{ padding: "3px 10px", color: rowColor, fontWeight: 600, borderBottom: "1px solid #1e1e3518" }}>{n.id}</td>
                  {chars.map(c => {
                    const v = row.get(c);
                    return (
                      <td key={c} style={{ padding: "3px 10px", textAlign: "center", borderBottom: "1px solid #1e1e3518", color: v === "✓" ? "#1D9E75" : v != null ? "#6EE7B7" : "#222260" }}>
                        {v != null ? String(v) : "–"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* bottom stats */}
      <div style={{ display: "flex", gap: 16, padding: "5px 14px 8px", borderTop: "1px solid #1e1e35", flexWrap: "wrap" }}>
        {[["Total Nodes", total, "#c4c0f5"], ["End of Word", endCount, "#1D9E75"], ["Height", height, "#c4c0f5"], ["Avg Branching", ab, "#EF9F27"]].map(([l, v, c]) => (
          <div key={String(l)} style={{ fontSize: 10, color: "#555577" }}>
            {l}: <span style={{ color: c as string }}>{v}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
