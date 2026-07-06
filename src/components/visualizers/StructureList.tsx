"use client";

import type { Snapshot } from "@/types/snapshot";
import type { LiveStructure } from "@/lib/visualizers/detect-live";

import { ArrayView } from "./ArrayView";
import { StringView } from "./StringView";
import { SetView } from "./SetView";
import { GridView } from "./GridView";
import { UnionFindView } from "./UnionFindView";
import { IntervalsView } from "./IntervalsView";
import { CounterView } from "./CounterView";
import { StackView } from "./StackView";
import { QueueView } from "./QueueView";
import { DPTableViz } from "./DPTableViz";
import { HashMapViz } from "./HashMapViz";
import { HeapViz } from "./HeapViz";

/**
 * Renders every live structure detected at the current step (Phase 2 multi-viz).
 * Node-based views (array/stack/queue) render one per variable; self-locating
 * views (matrix/hashmap/heap) render once per kind — they find their own data.
 */
export function StructureList({
  structures,
  snapshots,
  step,
}: {
  structures: LiveStructure[];
  snapshots: Snapshot[];
  step: number;
}) {
  if (structures.length === 0) return null;

  const seenSelfLocating = new Set<string>();

  return (
    <div className="flex flex-col gap-2">
      {structures.map((s) => {
        switch (s.view) {
          case "array":
            return <ArrayView key={s.key} name={s.name} node={s.node} diffState={s.diffState} overlay={s.overlay} />;
          case "string":
            return <StringView key={s.key} name={s.name} node={s.node} overlay={s.overlay} />;
          case "set":
            return <SetView key={s.key} name={s.name} node={s.node} diffState={s.diffState} />;
          case "grid":
            return <GridView key={s.key} name={s.name} node={s.node} grid={s.grid} />;
          case "union-find":
            return <UnionFindView key={s.key} name={s.name} node={s.node} />;
          case "intervals":
            return <IntervalsView key={s.key} name={s.name} node={s.node} />;
          case "counter":
            return <CounterView key={s.key} name={s.name} node={s.node} />;
          case "stack":
            return <StackView key={s.key} name={s.name} node={s.node} diffState={s.diffState} />;
          case "queue":
            return <QueueView key={s.key} name={s.name} node={s.node} diffState={s.diffState} />;
          // Self-locating views: render at most once each.
          case "matrix":
          case "hashmap":
          case "heap": {
            if (seenSelfLocating.has(s.view)) return null;
            seenSelfLocating.add(s.view);
            if (s.view === "matrix") return <DPTableViz key={s.key} snapshots={snapshots} step={step} />;
            if (s.view === "hashmap") return <HashMapViz key={s.key} snapshots={snapshots} step={step} />;
            return <HeapViz key={s.key} snapshots={snapshots} step={step} />;
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
