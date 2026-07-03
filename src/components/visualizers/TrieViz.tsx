"use client";

import { motion } from "framer-motion";

import type { Snapshot, ValueNode } from "@/types/snapshot";

interface TrieNode {
  id: number;
  /** Python object id of the backing node — lets us mark the node being visited. */
  pyId?: number;
  ch: string;
  isEnd: boolean;
  children: TrieNode[];
}

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

  return { id, pyId: node.id, ch, isEnd, children };
}

// ── tidy layout ────────────────────────────────────────────────────────────────
// Each leaf gets a fixed horizontal slot; a parent centres over its children's
// span. Subtrees can never overlap, no matter how bushy the trie gets.

const UNIT = 46;   // px per leaf slot
const LEVEL = 58;  // px per depth level
const R = 15;      // node radius

interface Placed { x: number; y: number; node: TrieNode; parent?: Placed }

function countLeaves(n: TrieNode): number {
  return n.children.length === 0 ? 1 : n.children.reduce((s, c) => s + countLeaves(c), 0);
}

function place(
  node: TrieNode,
  x0: number,
  depth: number,
  out: Placed[],
  parent?: Placed
): Placed {
  const width = countLeaves(node) * UNIT;
  const self: Placed = { x: x0 + width / 2, y: depth * LEVEL + 30, node, parent };
  out.push(self);
  let cursor = x0;
  for (const child of node.children) {
    place(child, cursor, depth + 1, out, self);
    cursor += countLeaves(child) * UNIT;
  }
  return self;
}

/** Smooth vertical cubic Bézier from parent rim to child rim. */
function edgePath(p: Placed, c: Placed): string {
  const y1 = p.y + R, y2 = c.y - R;
  const mid = (y1 + y2) / 2;
  return `M ${p.x} ${y1} C ${p.x} ${mid}, ${c.x} ${mid}, ${c.x} ${y2}`;
}

const spring = { type: "spring", stiffness: 260, damping: 26 } as const;

export function TrieViz({ snapshots, step }: { snapshots: Snapshot[]; step: number }) {
  const snap = snapshots[step];
  if (!snap) return null;

  const allLocals = snap.stack.flatMap((f) => f.locals);
  const rootVar = allLocals.find((v) => ["root", "self"].includes(v.name) || /trie/i.test(v.name));
  if (!rootVar) return null;

  // current node being visited (e.g. "node" or "curr" in insert/search)
  const currFrame = snap.stack.at(-1);
  const currVar = currFrame?.locals.find((v) => ["node", "curr", "cur"].includes(v.name));
  const currPyId = currVar?.value.id;

  const counter = { n: 0 };
  const root = parseTrie(rootVar.value, "", counter);
  if (!root) return null;

  const positions: Placed[] = [];
  place(root, 16, 0, positions);

  const W = countLeaves(root) * UNIT + 32;
  const H = (Math.max(...positions.map((p) => p.y)) + R + 20);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-white/[0.04] to-transparent">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/70">
          trie · {rootVar.name}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-muted-foreground/60">
          {positions.length} nodes
        </span>
      </div>

      {/* canvas */}
      <div className="overflow-x-auto bg-[#0b0b16] py-3">
        <svg className="mx-auto block" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <radialGradient id="trie-end" cx="50%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#2AB98A" />
              <stop offset="100%" stopColor="#0F5C3A" />
            </radialGradient>
            <radialGradient id="trie-node" cx="50%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#1c1c33" />
              <stop offset="100%" stopColor="#101020" />
            </radialGradient>
          </defs>

          {/* edges — smooth Béziers, drawn under nodes */}
          {positions.filter((p) => p.parent).map((p) => {
            const active = p.node.pyId !== undefined && p.node.pyId === currPyId;
            return (
              <motion.path
                key={`e-${p.node.id}`}
                animate={{ d: edgePath(p.parent!, p) }}
                initial={false}
                transition={spring}
                fill="none"
                stroke={active ? "#F5B942" : "#32325a"}
                strokeWidth={active ? 2 : 1.5}
                strokeLinecap="round"
                strokeOpacity={active ? 0.95 : 0.75}
              />
            );
          })}

          {/* nodes */}
          {positions.map((p) => {
            const { node } = p;
            const isRoot = node === root;
            const isCurr = node.pyId !== undefined && node.pyId === currPyId;
            const fill = node.isEnd ? "url(#trie-end)" : "url(#trie-node)";
            const stroke = isCurr ? "#F5B942" : node.isEnd ? "#2AB98A" : isRoot ? "#555577" : "#3a3a5f";
            const tc = isCurr ? "#FDE7BE" : node.isEnd ? "#EAFFF6" : "#9a9ac0";

            return (
              <motion.g
                key={node.id}
                animate={{ x: p.x, y: p.y }}
                initial={false}
                transition={spring}
              >
                {/* halo for current / end-of-word */}
                {isCurr && (
                  <motion.circle
                    r={R + 6}
                    fill="#F5B942"
                    animate={{ opacity: [0.25, 0.08, 0.25] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  />
                )}
                {node.isEnd && !isCurr && <circle r={R + 5} fill="#2AB98A" opacity={0.1} />}

                <circle r={R} fill={fill} stroke={stroke} strokeWidth={isCurr ? 2 : 1.5} />
                <text
                  y={4}
                  textAnchor="middle"
                  fontSize={isRoot ? 8 : 11}
                  fontFamily="var(--font-mono)"
                  fontWeight={700}
                  fill={isRoot ? "#666688" : tc}
                >
                  {isRoot ? "root" : node.ch}
                </text>

                {/* end-of-word tick */}
                {node.isEnd && (
                  <g transform={`translate(${R - 4}, ${-R + 4})`}>
                    <circle r={4.5} fill="#2AB98A" stroke="#0b0b16" strokeWidth={1.25} />
                    <path d="M -1.8 0 L -0.4 1.5 L 2 -1.4" stroke="#04281a" strokeWidth={1.3}
                      fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 px-3.5 py-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2AB98A]" />end of word
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-[#3a3a5f] bg-[#14142a]" />character
        </span>
        {currVar && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[#F5B942]" />
            visiting <span className="font-mono text-[#FDE7BE]">{currVar.name}</span>
          </span>
        )}
      </div>
    </div>
  );
}
