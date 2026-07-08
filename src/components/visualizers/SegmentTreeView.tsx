"use client";

import type { ValueNode } from "@/types/snapshot";
import { buildSegmentTree, type SegNode } from "@/lib/visualizers/segment-tree";

/**
 * SegmentTreeView (Phase 7) — draws a segment-tree array as the implicit binary
 * tree it really is (node `i` → children `2i`/`2i+1`), each node showing its
 * value and, when the size is a perfect tree, the range it aggregates. That
 * parent-covers-its-children's-range structure is the whole point of a segment
 * tree and is exactly what a flat array view can't convey.
 */
export function SegmentTreeView({
  name,
  node,
  diffState,
}: {
  name: string;
  node: ValueNode;
  diffState?: "added" | "changed" | "unchanged";
}) {
  const tree = buildSegmentTree(node);
  if (!tree.root) return null;

  const byIdx = new Map<number, SegNode>(tree.nodes.map((s) => [s.index, s]));

  // In-order x-slots so siblings never overlap; y by depth.
  const xOf = new Map<number, number>();
  let slot = 0;
  const assign = (idx: number | undefined) => {
    if (idx == null) return;
    const s = byIdx.get(idx);
    if (!s) return;
    assign(s.leftIdx);
    xOf.set(idx, slot++);
    assign(s.rightIdx);
  };
  assign(tree.root.index);

  const COL = 46, ROW = 52, PAD = 22, R = 15;
  const cols = Math.max(1, slot);
  const levels = Math.max(...tree.nodes.map((s) => s.level)) + 1;
  const W = cols * COL + PAD * 2 - (COL - 2 * R);
  const H = (levels - 1) * ROW + PAD * 2;
  const px = (idx: number) => PAD + R + (xOf.get(idx) ?? 0) * COL;
  const py = (level: number) => PAD + level * ROW;

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>{name} · segment tree</span>
        <span className="normal-case text-muted-foreground/60">
          {tree.nodes.length} nodes
          {diffState === "changed" && <span className="ml-1 text-amber-400">· updated</span>}
        </span>
      </div>

      <div className="overflow-x-auto bg-[#0b0b16]">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto block">
          {/* edges */}
          {tree.nodes.flatMap((s) =>
            [s.leftIdx, s.rightIdx].filter((c): c is number => c != null).map((c) => (
              <line
                key={`${s.index}-${c}`}
                x1={px(s.index)} y1={py(s.level)}
                x2={px(c)} y2={py(byIdx.get(c)!.level)}
                stroke="#2f2f4a" strokeWidth={1.25}
              />
            ))
          )}

          {/* nodes */}
          {tree.nodes.map((s) => {
            const isRoot = s.index === tree.root!.index;
            const isLeaf = s.leftIdx == null && s.rightIdx == null;
            const accent = isRoot ? "#a78bfa" : isLeaf ? "#34d399" : "#60a5fa";
            const x = px(s.index), y = py(s.level);
            return (
              <g key={s.index}>
                <circle cx={x} cy={y} r={R} fill={`${accent}1f`} stroke={accent} strokeWidth={1.5} />
                <text x={x} y={y + 3.5} textAnchor="middle"
                  fontSize={11} fontFamily="var(--font-mono)" fontWeight="700" fill={accent}>
                  {s.value}
                </text>
                {s.covers && (
                  <text x={x} y={y + R + 9} textAnchor="middle"
                    fontSize={8} fontFamily="var(--font-mono)" fill={`${accent}bb`}>
                    {s.covers[0] === s.covers[1] ? `[${s.covers[0]}]` : `${s.covers[0]}–${s.covers[1]}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#a78bfa]" />root</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#60a5fa]" />internal</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#34d399]" />leaf</span>
        <span className="ml-auto normal-case">
          {tree.ranged ? "each node aggregates its children's range" : "ranges shown for power-of-two sizes"}
        </span>
      </div>
    </div>
  );
}
