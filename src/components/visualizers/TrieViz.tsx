"use client";

import type { Snapshot, ValueNode } from "@/types/snapshot";

interface TrieNode { id: number; ch: string; isEnd: boolean; children: TrieNode[] }
interface Pos { x: number; y: number; node: TrieNode }

/** Parse a trie node — supports class-based (self.children dict) and dict-based tries */
function parseTrie(
  node: ValueNode | undefined | null,
  ch: string,
  counter: { n: number },
  depth = 0
): TrieNode | undefined {
  if (!node || node.kind === "none" || depth > 8) return undefined;
  const id = ++counter.n;

  let childrenMap: ValueNode | undefined;
  let isEnd = false;

  if (node.kind === "object" && node.attributes) {
    childrenMap = node.attributes.find((a) => ["children", "kids", "next"].includes(a.name))?.value;
    const endAttr = node.attributes.find((a) => ["is_end", "isEnd", "end", "is_word", "word"].includes(a.name));
    isEnd = !!(endAttr && (endAttr.value.value === true || endAttr.value.repr === "True"));
  } else if (node.kind === "dict" && node.entries) {
    const childEntry = node.entries.find((e) => ["children", "kids", "next"].includes(String(e.key.value)));
    childrenMap = childEntry?.value;
    const endEntry = node.entries.find((e) => ["is_end", "isEnd", "end", "is_word"].includes(String(e.key.value)));
    isEnd = !!(endEntry && (endEntry.value.value === true));
  }

  const children: TrieNode[] = [];
  if (childrenMap?.kind === "dict" && childrenMap.entries) {
    for (const { key, value } of childrenMap.entries) {
      const childCh = String(key.value ?? key.repr ?? "?");
      const child = parseTrie(value, childCh, counter, depth + 1);
      if (child) children.push(child);
    }
  }

  return { id, ch, isEnd, children };
}

function layout(node: TrieNode, x: number, y: number, spread: number, out: Pos[] = []): Pos[] {
  out.push({ x, y, node });
  const n = node.children.length;
  if (n === 0) return out;
  const totalWidth = (n - 1) * spread;
  node.children.forEach((child, i) => {
    const cx = x - totalWidth / 2 + i * spread;
    layout(child, cx, y + 44, Math.max(spread * 0.6, 30), out);
  });
  return out;
}

function edges(node: TrieNode, x: number, y: number, spread: number,
  out: { px: number; py: number; cx: number; cy: number; id: string }[] = []) {
  const n = node.children.length;
  if (n === 0) return out;
  const totalWidth = (n - 1) * spread;
  node.children.forEach((child, i) => {
    const cx = x - totalWidth / 2 + i * spread;
    const cy = y + 44;
    out.push({ px: x, py: y, cx, cy, id: `${node.id}-${child.id}` });
    edges(child, cx, cy, Math.max(spread * 0.6, 30), out);
  });
  return out;
}

export function TrieViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  if (!snap) return null;

  const allLocals = snap.stack.flatMap((f) => f.locals);
  const rootVar = allLocals.find((v) => ["root", "self"].includes(v.name) || /trie/i.test(v.name));
  if (!rootVar) return null;

  // current node being visited (e.g. "node" or "curr" in insert/search)
  const currFrame = snap.stack.at(-1);
  const currVar = currFrame?.locals.find((v) => ["node", "curr", "cur"].includes(v.name));

  const counter = { n: 0 };
  const root = parseTrie(rootVar.value, "•", counter);
  if (!root) return null;

  const W = 300, startX = 150, startY = 22, initSpread = 56;
  const positions = layout(root, startX, startY, initSpread);
  const edgeList = edges(root, startX, startY, initSpread);
  const maxY = Math.max(...positions.map((p) => p.y)) + 26;
  const H = Math.max(110, maxY);

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        trie · {positions.length} nodes
      </div>
      <div className="bg-[#0d0d1a] flex justify-center overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {edgeList.map((e) => (
            <line key={e.id} x1={e.px} y1={e.py} x2={e.cx} y2={e.cy}
              stroke="#2a2a4a" strokeWidth={1.5} strokeOpacity={0.7} />
          ))}
          {positions.map(({ x, y, node }) => {
            const isRoot = node === root;
            const isEnd  = node.isEnd;
            const fill   = isRoot ? "#1e1e2e" : isEnd ? "#0F5C3A" : "#12122a";
            const stroke = isRoot ? "#555577" : isEnd ? "#1D9E75" : "#3a3a5a";
            const tc     = isEnd ? "#fff" : "#8888aa";
            return (
              <g key={node.id}>
                {isEnd && <circle cx={x} cy={y} r={15} fill="#1D9E75" opacity={0.12} />}
                <circle cx={x} cy={y} r={12} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text x={x} y={y + 4} textAnchor="middle"
                  fontSize={10} fontFamily="var(--font-mono)" fontWeight="700" fill={tc}>
                  {node.ch}
                </text>
                {isEnd && (
                  <circle cx={x + 9} cy={y - 9} r={3} fill="#1D9E75" stroke="#0d0d1a" strokeWidth={1} />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex items-center gap-3 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#1D9E75]" />end of word</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-[#3a3a5a] bg-[#12122a]" />character node</span>
        {currVar && <span>current: <span className="font-mono text-violet-300">{currVar.name}</span></span>}
      </div>
    </div>
  );
}
