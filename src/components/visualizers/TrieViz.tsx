"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";

// ── trie node (our internal representation) ───────────────────────────────────

interface TNode { id: number; ch: string; isEnd: boolean; children: Map<string, TNode> }

// ── parse from dict (from the _snapshot variable: {children:{}, is_end:bool}) ──

function parseDictNode(vnode: ValueNode | undefined, counter: { n: number }, depth = 0): TNode | undefined {
  if (!vnode || vnode.kind === "none" || depth > 30) return undefined;
  const tnode: TNode = { id: counter.n++, ch: "•", isEnd: false, children: new Map() };

  if (vnode.kind === "dict" && vnode.entries) {
    const isEndEntry = vnode.entries.find((e) =>
      ["is_end", "isEnd", "end_of_word"].includes(String(e.key.value ?? e.key.repr ?? "").replace(/^['"]|['"]$/g, ""))
    );
    if (isEndEntry) tnode.isEnd = isEndEntry.value.value === true || isEndEntry.value.repr === "True";

    const childrenEntry = vnode.entries.find((e) =>
      ["children", "kids"].includes(String(e.key.value ?? e.key.repr ?? "").replace(/^['"]|['"]$/g, ""))
    );
    if (childrenEntry?.value.kind === "dict" && childrenEntry.value.entries) {
      for (const { key, value } of childrenEntry.value.entries) {
        const ch = String(key.value ?? key.repr ?? "").replace(/^['"]|['"]$/g, "");
        if (!ch) continue;
        const child = parseDictNode(value, counter, depth + 1);
        if (child) { child.ch = ch; tnode.children.set(ch, child); }
      }
    }
  }
  return tnode;
}

// ── parse from object attributes (a real TrieNode instance) ───────────────────

function getAttr(node: ValueNode, name: string): ValueNode | undefined {
  return node.attributes?.find((a) => a.name === name)?.value;
}

function parseTrieNode(vnode: ValueNode | undefined, counter: { n: number }, depth = 0): TNode | undefined {
  if (!vnode || vnode.kind === "none" || depth > 30) return undefined;
  const tnode: TNode = { id: counter.n++, ch: "•", isEnd: false, children: new Map() };

  const isEndAttr = getAttr(vnode, "is_end") ?? getAttr(vnode, "isEnd") ?? getAttr(vnode, "end_of_word");
  if (isEndAttr) tnode.isEnd = isEndAttr.value === true || isEndAttr.repr === "True";

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

function countNodes(n: TNode): number { let c = 1; n.children.forEach((ch) => (c += countNodes(ch))); return c; }
function treeDepth(n: TNode): number { if (!n.children.size) return 0; let mx = 0; n.children.forEach((ch) => { const h = treeDepth(ch); if (h > mx) mx = h; }); return mx + 1; }

function collectWords(root: TNode): string[] {
  const out: string[] = [];
  const dfs = (n: TNode, prefix: string) => {
    const cur = n.ch === "•" ? prefix : prefix + n.ch;
    if (n.isEnd) out.push(cur);
    n.children.forEach((c) => dfs(c, cur));
  };
  dfs(root, "");
  return out.sort();
}

// ── tidy tree layout ──────────────────────────────────────────────────────────

interface Laid { node: TNode; x: number; y: number }

function tidyLayout(root: TNode) {
  const all: Laid[] = [];
  let leaf = 0;

  const assign = (n: TNode, d: number): Laid => {
    const kids = [...n.children.values()];
    let x: number;
    if (kids.length === 0) {
      x = leaf++;
    } else {
      const cs = kids.map((k) => assign(k, d + 1));
      x = (cs[0].x + cs[cs.length - 1].x) / 2;
    }
    const laid: Laid = { node: n, x, y: d };
    all.push(laid);
    return laid;
  };
  assign(root, 0);

  const laidById = new Map(all.map((l) => [l.node.id, l]));
  const edges: { from: Laid; to: Laid; ch: string }[] = [];
  for (const l of all) {
    l.node.children.forEach((c, ch) => {
      const cl = laidById.get(c.id);
      if (cl) edges.push({ from: l, to: cl, ch });
    });
  }
  return { all, edges, cols: Math.max(1, leaf) };
}

// ── palette ───────────────────────────────────────────────────────────────────

const COL = {
  root:    { fill: "#2A1D57", stroke: "#9B96E8", text: "#C4C0F5" },
  path:    { fill: "#3A2600", stroke: "#EF9F27", text: "#FCD34D" },
  fail:    { fill: "#3A0B0B", stroke: "#DC2626", text: "#FCA5A5" },
  end:     { fill: "#0E3B2C", stroke: "#1D9E75", text: "#6EE7B7" },
  endPath: { fill: "#3A2600", stroke: "#EF9F27", text: "#FCD34D" },
  plain:   { fill: "#161630", stroke: "#33335a", text: "#B7B7DE" },
};

// ── main component ────────────────────────────────────────────────────────────

export function TrieViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  const allLocals = snap ? snap.stack.flatMap((f) => f.locals) : [];

  let rootVNode: ValueNode | undefined;
  let useDict = false;
  const pick = (v: ValueNode | undefined, asDict: boolean) => {
    if (v && !rootVNode) { rootVNode = v; useDict = asDict; }
  };

  pick(allLocals.find((v) => v.name === "_snapshot" && v.value.kind === "dict")?.value, true);
  pick(allLocals.find((v) => v.name === "root" && v.value.kind === "object")?.value, false);
  for (const v of allLocals) {
    if (rootVNode) break;
    if (v.value.kind !== "object") continue;
    const s = getAttr(v.value, "_snapshot");
    if (s?.kind === "dict") { pick(s, true); break; }
    const r = getAttr(v.value, "root");
    if (r?.kind === "object") { pick(r, false); break; }
    if (getAttr(v.value, "children")?.kind === "dict") { pick(v.value, false); break; }
  }

  let root: TNode | null = null;
  if (rootVNode) {
    const counter = { n: 0 };
    const parsed = useDict ? parseDictNode(rootVNode, counter) : parseTrieNode(rootVNode, counter);
    if (parsed) { parsed.ch = "•"; root = parsed; }
  }

  const wordVar = allLocals.find((v) => v.name === "word");
  const currentWord = wordVar
    ? String(wordVar.value.value ?? wordVar.value.repr ?? "").replace(/^['"]|['"]$/g, "")
    : "";

  const pathIds = new Set<number>();
  let failed = false;
  if (root && currentWord) {
    let cur: TNode = root;
    pathIds.add(cur.id);
    for (const c of currentWord) {
      const child = cur.children.get(c);
      if (child) { cur = child; pathIds.add(cur.id); }
      else { failed = true; break; }
    }
  }

  if (!snap || !root) {
    return (
      <div className="rounded-md border border-border/50 bg-[#0d0d1a] p-4 text-center text-xs text-muted-foreground">
        Trie detected — building the tree…
      </div>
    );
  }

  const words = collectWords(root);
  const nodeCount = countNodes(root);
  const { all, edges, cols } = tidyLayout(root);

  const R = 15, XSTEP = 46, YSTEP = 62, PAD = 26;
  const W = Math.max(220, PAD * 2 + (cols - 1) * XSTEP);
  const H = PAD * 2 + treeDepth(root) * YSTEP;
  const px = (x: number) => PAD + x * XSTEP;
  const py = (y: number) => PAD + y * YSTEP;

  const colorFor = (l: Laid) => {
    const onPath = pathIds.has(l.node.id);
    if (l.node.ch === "•") return COL.root;
    if (onPath && l.node.isEnd) return COL.endPath;
    if (onPath) return COL.path;
    if (l.node.isEnd) return COL.end;
    return COL.plain;
  };

  return (
    <div className="overflow-hidden rounded-md border border-border/50 bg-[#0b0b16]">
      {/* header */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border/40 bg-muted/30 px-3 py-2">
        <Stat label="words" value={words.length} />
        <Stat label="nodes" value={nodeCount} />
        <Stat label="depth" value={treeDepth(root)} />
        <div className="ml-auto flex flex-wrap gap-3">
          <Legend color="#9B96E8" label="root" />
          <Legend color="#EF9F27" label="current word" />
          <Legend color="#1D9E75" label="end of word" />
        </div>
      </div>

      {/* tree */}
      <div className="overflow-auto bg-[#0b0b16] p-2">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto block">
          {edges.map((e, i) => {
            const onPath = pathIds.has(e.to.node.id);
            const x1 = px(e.from.x), y1 = py(e.from.y) + R;
            const x2 = px(e.to.x),   y2 = py(e.to.y) - R;
            const mx = (x1 + x2) / 2 + (x2 > x1 ? 8 : -8);
            const my = (y1 + y2) / 2;
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={onPath ? "#EF9F27" : "#2c2c50"}
                  strokeWidth={onPath ? 2 : 1.5} />
                <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
                  fontSize={10} fontFamily="var(--font-mono)" fill="#8888aa">
                  {e.ch}
                </text>
              </g>
            );
          })}
          {all.map((l) => {
            const c = colorFor(l);
            const x = px(l.x), y = py(l.y);
            const isRoot = l.node.ch === "•";
            return (
              <g key={l.node.id}>
                {l.node.isEnd && !isRoot && (
                  <circle cx={x} cy={y} r={R + 3} fill="none" stroke={c.stroke} strokeWidth={1} opacity={0.5} />
                )}
                <circle cx={x} cy={y} r={R} fill={c.fill} stroke={c.stroke} strokeWidth={isRoot ? 2 : 1.5} />
                <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="central"
                  fontFamily="var(--font-mono)" fontWeight={700}
                  fontSize={isRoot ? 11 : 13} fill={c.text}>
                  {isRoot ? "•" : l.node.ch}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* stored words */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 px-3 py-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">words</span>
        {words.length === 0 ? (
          <span className="text-[11px] text-muted-foreground/50">none yet</span>
        ) : (
          words.map((w) => {
            const active = w === currentWord;
            return (
              <span key={w} className="rounded px-1.5 py-0.5 font-mono text-[11px]"
                style={{ color: active ? "#FCD34D" : "#6EE7B7", background: active ? "#3A2600" : "#0E3B2C" }}>
                {w}
              </span>
            );
          })
        )}
      </div>

      {/* current word status */}
      {currentWord && (
        <div className="border-t border-border/40 px-3 py-1.5 font-mono text-[11px]"
          style={{ background: failed ? "#3A0B0B22" : "#0E3B2C22" }}>
          <span className="text-muted-foreground/60">word = </span>
          <span style={{ color: "#EF9F27" }}>&quot;{currentWord}&quot;</span>
          <span className="text-muted-foreground/40"> · </span>
          <span style={{ color: failed ? "#FCA5A5" : "#6EE7B7" }}>
            {failed ? "path breaks — not in trie" : "path exists in trie"}
          </span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-base font-bold text-[#C4C0F5]">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/50">{label}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span className="inline-block size-2 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}
