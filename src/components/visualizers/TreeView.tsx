"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ReactFlow,
  Background,
  type Node as RFNode,
  type Edge as RFEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  hierarchy,
  tree as d3tree,
  type HierarchyPointNode,
} from "d3-hierarchy";

import type { ValueNode } from "@/types/snapshot";

interface Props {
  name: string;
  node: ValueNode;
}

interface TreeDatum {
  id: string;
  label: string;
  isNull?: boolean;
  children: TreeDatum[];
}

function findAttr(node: ValueNode, attrName: string): ValueNode | null {
  return (node.attributes ?? []).find((a) => a.name === attrName)?.value ?? null;
}

function dataLabel(node: ValueNode): string {
  for (const key of ["val", "value", "data", "key"]) {
    const v = findAttr(node, key);
    if (v && v.value != null) return v.repr;
  }
  return node.repr;
}

function buildTreeDatum(
  node: ValueNode,
  path: string,
  seen: ReadonlySet<number>
): TreeDatum {
  const nextSeen = node.id != null ? new Set(seen).add(node.id) : seen;
  const children: TreeDatum[] = [];

  for (const [attrName, suffix] of [
    ["left", "L"],
    ["right", "R"],
  ] as const) {
    const child = findAttr(node, attrName);

    // None child → show dashed null indicator
    if (!child || child.kind === "none") {
      children.push({
        id: `${path}.${suffix}_null`,
        label: "∅",
        isNull: true,
        children: [],
      });
      continue;
    }

    if (child.id != null && seen.has(child.id)) continue; // cycle guard
    children.push(buildTreeDatum(child, `${path}.${suffix}`, nextSeen));
  }

  return { id: path, label: dataLabel(node), children };
}

const NODE_SIZE = 44;

export function TreeView({ name, node }: Props) {
  const { nodes, edges } = useMemo(() => {
    const root = buildTreeDatum(node, "root", new Set());
    const layout = d3tree<TreeDatum>().nodeSize([NODE_SIZE + 20, NODE_SIZE + 44]);
    const positioned = layout(hierarchy(root, (d) => d.children));

    const rfNodes: RFNode[] = [];
    const rfEdges: RFEdge[] = [];

    positioned.each((d: HierarchyPointNode<TreeDatum>) => {
      const isNull = d.data.isNull;

      rfNodes.push({
        id: d.data.id,
        data: { label: d.data.label },
        position: { x: d.x, y: d.y },
        draggable: false,
        style: isNull
          ? {
              // dashed null leaf
              width: NODE_SIZE - 8,
              height: NODE_SIZE - 8,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "1.5px dashed rgba(100,116,139,0.4)",
              color: "rgba(100,116,139,0.5)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
            }
          : {
              // real node — matches ArrayView card style
              width: NODE_SIZE,
              height: NODE_SIZE,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(56,189,248,0.10)",
              border: "2px solid rgba(56,189,248,0.7)",
              color: "rgb(125,211,252)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 0 0 3px rgba(56,189,248,0.08)",
            },
      });

      if (d.parent) {
        const isNullEdge = d.data.isNull;
        rfEdges.push({
          id: `${d.parent.data.id}->${d.data.id}`,
          source: d.parent.data.id,
          target: d.data.id,
          style: {
            stroke: isNullEdge
              ? "rgba(100,116,139,0.25)"
              : "rgba(148,163,184,0.55)",
            strokeDasharray: isNullEdge ? "4 3" : undefined,
            strokeWidth: isNullEdge ? 1 : 1.5,
          },
        });
      }
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [node]);

  return (
    <div className="rounded-xl border-2 border-border/60 bg-card p-3 shadow-sm">
      {/* header — matches ArrayView/StackView style */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono text-[13px] font-medium text-sky-300">
          {name}
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm border-2 border-sky-400 bg-sky-400/10" />
            <span className="text-[10px] text-muted-foreground">node</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-500/50" />
            <span className="text-[10px] text-muted-foreground">null</span>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            binary tree
          </span>
        </div>
      </div>

      {/* React Flow canvas */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ height: 280 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesConnectable={false}
          elementsSelectable={false}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            gap={16}
            color="rgba(148,163,184,0.06)"
          />
        </ReactFlow>
      </motion.div>
    </div>
  );
}
