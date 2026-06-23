"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  type Node as RFNode,
  type Edge as RFEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { ValueNode } from "@/types/snapshot";

interface Props {
  name: string;
  node: ValueNode;
}

interface GraphData {
  nodeIds: string[];
  edges: Array<[string, string]>;
}

function findAttr(node: ValueNode, attrName: string): ValueNode | null {
  return (node.attributes ?? []).find((a) => a.name === attrName)?.value ?? null;
}

/** Adjacency-dict shape: { key: [neighbor, neighbor, ...], ... }. */
function fromAdjacencyDict(node: ValueNode): GraphData {
  const nodeIds = new Set<string>();
  const edges: Array<[string, string]> = [];
  const seenPairs = new Set<string>();

  for (const entry of node.entries ?? []) {
    const id = entry.key.repr;
    nodeIds.add(id);
    for (const neighbor of entry.value.items ?? []) {
      const neighborId = neighbor.repr;
      nodeIds.add(neighborId);
      const pairKey = [id, neighborId].sort().join("|");
      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        edges.push([id, neighborId]);
      }
    }
  }
  return { nodeIds: [...nodeIds], edges };
}

/** Explicit-object shape: an object with .nodes (list) and .edges (list of pairs). */
function fromNodesEdgesObject(node: ValueNode): GraphData {
  const nodesAttr = findAttr(node, "nodes");
  const edgesAttr = findAttr(node, "edges");
  const nodeIds = (nodesAttr?.items ?? []).map((n) => n.repr);
  const edges: Array<[string, string]> = [];
  for (const e of edgesAttr?.items ?? []) {
    const pair = e.items ?? [];
    if (pair.length >= 2) edges.push([pair[0].repr, pair[1].repr]);
  }
  return { nodeIds, edges };
}

function buildGraphData(node: ValueNode): GraphData {
  return node.kind === "dict" ? fromAdjacencyDict(node) : fromNodesEdgesObject(node);
}

/**
 * Vumi: this is the plain functional baseline (same role TreeView's
 * pre-polish version played) — card style / legend / edge styling should
 * match ArrayView/TreeView. Layout is a simple deterministic circle so it's
 * stable across steps; a force-directed layout would be a nice follow-up.
 * Visited/current-node highlighting for BFS/DFS step animations is a
 * separate trace-signal piece (mirrors sort-trace.ts) that isn't wired up
 * yet — this component only renders the graph's current shape.
 */
export function GraphView({ name, node }: Props) {
  const { nodes, edges } = useMemo(() => {
    const { nodeIds, edges: graphEdges } = buildGraphData(node);

    const radius = Math.max(90, nodeIds.length * 22);
    const center = radius + 30;
    const rfNodes: RFNode[] = nodeIds.map((id, i) => {
      const angle = (2 * Math.PI * i) / nodeIds.length;
      return {
        id,
        data: { label: id },
        position: {
          x: center + radius * Math.cos(angle),
          y: center + radius * Math.sin(angle),
        },
        draggable: false,
        style: {
          width: 40,
          height: 40,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(56,189,248,0.10)",
          border: "2px solid rgba(56,189,248,0.7)",
          color: "rgb(125,211,252)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 12,
          fontWeight: 600,
        },
      };
    });

    const rfEdges: RFEdge[] = graphEdges.map(([source, target]) => ({
      id: `${source}->${target}`,
      source,
      target,
      style: { stroke: "rgba(148,163,184,0.55)", strokeWidth: 1.5 },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [node]);

  return (
    <div className="rounded-xl border-2 border-border/60 bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono text-[13px] font-medium text-sky-300">{name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          graph
        </span>
      </div>
      <div style={{ height: 280 }}>
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
          <Background gap={16} color="rgba(148,163,184,0.06)" />
        </ReactFlow>
      </div>
    </div>
  );
}
