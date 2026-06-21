"use client";

/**
 * TreeView — baseline binary-tree visualizer (Phase 7).
 *
 * Walks the ValueNode's .left/.right attribute chain into a plain tree,
 * lays it out with d3-hierarchy's tree() (so it's a real top-down layout,
 * not just guessed coordinates), and renders it with React Flow.
 *
 * 🟣 Vumi: this is the baseline to build on — same role SortBarsView had for
 * Phase 6. Data layer (structure detection + the tree walk below) is done
 * and verified; what's missing is polish:
 *   - Match the visual language of ArrayView/StackView (card border, the
 *     same sky-300 name label style, etc.) instead of the plain circles below.
 *   - Animate node position changes with Framer Motion when the tree
 *     reshapes (insert a node, rotate, etc.) — React Flow nodes accept a
 *     `style`/`position` per render, so this is the same kind of
 *     animate-on-change as SortBarsView's bars.
 *   - A null-child indicator (small dashed leaf) instead of just omitting
 *     None children entirely, so an empty tree / leaf nodes don't look broken.
 */

import { useMemo } from "react";
import { ReactFlow, Background, type Node as RFNode, type Edge as RFEdge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { hierarchy, tree as d3tree, type HierarchyPointNode } from "d3-hierarchy";

import type { ValueNode } from "@/types/snapshot";

interface Props {
  name: string;
  node: ValueNode;
}

interface TreeDatum {
  id: string;
  label: string;
  children: TreeDatum[];
}

function findAttr(node: ValueNode, attrName: string): ValueNode | null {
  return (node.attributes ?? []).find((a) => a.name === attrName)?.value ?? null;
}

/** Best-effort label for a tree node's payload — falls back to its repr. */
function dataLabel(node: ValueNode): string {
  for (const key of ["val", "value", "data", "key"]) {
    const v = findAttr(node, key);
    if (v && v.value != null) return v.repr;
  }
  return node.repr;
}

function buildTreeDatum(node: ValueNode, path: string, seen: ReadonlySet<number>): TreeDatum {
  const nextSeen = node.id != null ? new Set(seen).add(node.id) : seen;
  const children: TreeDatum[] = [];

  for (const [attrName, suffix] of [["left", "L"], ["right", "R"]] as const) {
    const child = findAttr(node, attrName);
    if (!child || child.kind === "none") continue;
    if (child.id != null && seen.has(child.id)) continue; // cycle guard
    children.push(buildTreeDatum(child, `${path}.${suffix}`, nextSeen));
  }

  return { id: path, label: dataLabel(node), children };
}

const NODE_SIZE = 48;

export function TreeView({ name, node }: Props) {
  const { nodes, edges } = useMemo(() => {
    const root = buildTreeDatum(node, "root", new Set());
    const layout = d3tree<TreeDatum>().nodeSize([NODE_SIZE + 16, NODE_SIZE + 36]);
    const positioned = layout(hierarchy(root, (d) => d.children));

    const rfNodes: RFNode[] = [];
    const rfEdges: RFEdge[] = [];

    positioned.each((d: HierarchyPointNode<TreeDatum>) => {
      rfNodes.push({
        id: d.data.id,
        data: { label: d.data.label },
        position: { x: d.x, y: d.y },
        draggable: false,
        style: {
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(56,189,248,0.12)",
          border: "2px solid rgb(56,189,248)",
          color: "white",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 12,
        },
      });
      if (d.parent) {
        rfEdges.push({
          id: `${d.parent.data.id}->${d.data.id}`,
          source: d.parent.data.id,
          target: d.data.id,
          style: { stroke: "rgba(148,163,184,0.6)" },
        });
      }
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [node]);

  return (
    <div className="rounded-xl border-2 bg-card p-2 shadow-sm">
      <div className="mb-1 px-2 pt-1 font-mono text-[13px] font-medium text-sky-300">{name}</div>
      <div style={{ height: 260 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
