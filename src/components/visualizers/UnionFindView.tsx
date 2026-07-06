"use client";

import type { ValueNode } from "@/types/snapshot";
import { buildForest } from "@/lib/visualizers/union-find";

const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#fb923c", "#2dd4bf", "#f87171"];

/**
 * UnionFindView (Phase 7) — a DSU `parent` array shown as connected components:
 * elements grouped by their root, each group colored, roots ringed. Makes the
 * "which things are already joined" state legible in a way a flat array can't.
 */
export function UnionFindView({ name, node }: { name: string; node: ValueNode }) {
  const { parent, components } = buildForest(node);

  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>{name} · union-find</span>
        <span className="normal-case text-muted-foreground/60">
          {components.length} set{components.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 bg-[#0b0b16] p-3">
        {components.map((comp, ci) => {
          const color = COLORS[ci % COLORS.length];
          return (
            <div
              key={comp.root}
              className="flex flex-col gap-1 rounded-lg border p-2"
              style={{ borderColor: `${color}55`, background: `${color}0d` }}
            >
              <div className="flex flex-wrap gap-1">
                {comp.members.map((m) => {
                  const isRoot = m === comp.root;
                  return (
                    <div
                      key={m}
                      className="flex flex-col items-center"
                      title={`parent[${m}] = ${parent[m]}`}
                    >
                      <div
                        className="flex size-7 items-center justify-center rounded-md font-mono text-[12px] font-bold"
                        style={{
                          color,
                          background: `${color}1f`,
                          border: isRoot ? `2px solid ${color}` : `1px solid ${color}55`,
                        }}
                      >
                        {m}
                      </div>
                      {isRoot && <span className="text-[8px]" style={{ color }}>root</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        each box is one connected set · the ringed element is its representative (root)
      </div>
    </div>
  );
}
