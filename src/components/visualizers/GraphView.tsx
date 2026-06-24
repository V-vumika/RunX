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
 * Polish pass: card header + legend (node/edge colour swatch), refined node
 * and edge styling, and a CSS fade+scale entrance animation via the
 * .runx-animated-flow class (defined in globals.css). Visited/current-node
 * highlighting for BFS/DFS step animation is out of scope here — it needs a
 * separate trace-signal layer (mirrors sort-trace.ts) that the engine hasn't
 * wired up yet.
 */
export function GraphView({ name, node }: Props) {
  const { nodes, edges } = useMemo(() => {
    const { nodeIds, edges: graphEdges } = buildGraphData(node);

    const count = nodeIds.length;
    const radius = Math.max(100, count * 24);
    const center = radius + 40;

    const rfNodes: RFNode[] = nodeIds.map((id, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2; // start from top
      return {
        id,
        data: { label: id },
        position: {
          x: center + radius * Math.cos(angle),
          y: center + radius * Math.sin(angle),
        },
        draggable: false,
        style: {
          width: 44,
          height: 44,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(56,189,248,0.10)",
          border: "1.8px solid rgba(56,189,248,0.70)",
          color: "rgb(125,211,252)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "0 0 0 3px rgba(56,189,248,0.08)",
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        },
      };
    });

    const rfEdges: RFEdge[] = graphEdges.map(([source, target]) => ({
      id: `${source}->${target}`,
      source,
      target,
      style: {
        stroke: "rgba(148,163,184,0.45)",
        strokeWidth: 1.5,
      },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [node]);

  return (
    <div
      className="runx-animated-flow rounded-xl border border-border/60 bg-card p-3 shadow-sm"
      style={{
        animation: "graphEntrance 0.25s ease both",
      }}
    >
      {/* Card header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono text-[13px] font-semibold text-sky-300">{name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          graph
        </span>
      </div>

      {/* Legend */}
      <div className="mb-2 flex items-center gap-3 px-1">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{
              background: "rgba(56,189,248,0.12)",
              border: "1.5px solid rgba(56,189,248,0.65)",
            }}
          />
          <span className="text-[10px] text-muted-foreground">node</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-px w-5"
            style={{ background: "rgba(148,163,184,0.55)" }}
          />
          <span className="text-[10px] text-muted-foreground">edge</span>
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
          {nodes.length}v · {edges.length}e
        </span>
      </div>

      {/* Flow canvas */}
      <div
        style={{ height: 280 }}
        className="overflow-hidden rounded-lg"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.28 }}
          nodesConnectable={false}
          elementsSelectable={false}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} color="rgba(148,163,184,0.05)" />
        </ReactFlow>
      </div>

      {/* Entrance animation keyframes — scoped inline so no globals dependency */}
      <style>{`
        @keyframes graphEntrance {
          from { opacity: 0; transform: scale(0.97) translateY(4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}