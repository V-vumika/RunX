"use client";

/**
 * DsaPanel — picks the right DSA visualizer for each variable in scope
 * and lays them out in a scrollable panel.
 *
 * For each variable in the current frame's locals it:
 *   1. Detects the structure kind (detectStructure).
 *   2. Computes the change state vs the previous step (diffFrames).
 *   3. Renders the matching view component.
 *
 * Variables with no dedicated visualizer (primitives, generic dicts, …) are
 * shown with a fallback ValueView row so nothing disappears.
 */

import type { ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";
import { detectStructure } from "@/lib/visualizers/structure-detect";
import { diffFrames } from "@/lib/visualizers/step-diff";
import { ValueView } from "@/components/inspector/ValueView";
import { ArrayView } from "./ArrayView";
import { StackView } from "./StackView";
import { QueueView } from "./QueueView";
import { LinkedListView } from "./LinkedListView";

export function DsaPanel() {
  const snapshot = useExecutionStore(selectCurrentSnapshot);
  const hasTrace = useExecutionStore((s) => s.snapshots.length > 0);
  const prevSnapshot = useExecutionStore((s) =>
    s.currentStep > 0 ? s.snapshots[s.currentStep - 1] : null
  );

  if (!hasTrace) {
    return <EmptyState>Run your code to see DSA visualizations.</EmptyState>;
  }
  if (!snapshot) return null;

  const currFrame = snapshot.stack.at(-1);
  const prevFrame = prevSnapshot?.stack.at(-1) ?? null;
  const variables = currFrame?.locals.filter((v) => !v.name.startsWith("__")) ?? [];

  const diff = diffFrames(prevFrame, currFrame ?? null);

  if (variables.length === 0) {
    return <EmptyState>No variables in scope at this step.</EmptyState>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 p-3">
        {variables.map((v) => {
          const kind = detectStructure(v.name, v.value);
          const state = diff.stateOf(v.name);

          if (kind === "array") {
            return <ArrayView key={v.name} name={v.name} node={v.value} diffState={state} />;
          }
          if (kind === "stack") {
            return <StackView key={v.name} name={v.name} node={v.value} diffState={state} />;
          }
          if (kind === "queue") {
            return <QueueView key={v.name} name={v.name} node={v.value} diffState={state} />;
          }
          if (kind === "linked-list") {
            return <LinkedListView key={v.name} name={v.name} node={v.value} diffState={state} />;
          }

          // Fallback for primitives / dicts / generics.
          return (
            <div key={v.name} className="flex items-baseline gap-2 rounded-md border bg-card px-3 py-2">
              <span className="shrink-0 font-mono text-[12px] font-medium text-sky-300">{v.name}</span>
              <span className="text-muted-foreground">=</span>
              <ValueView node={v.value} />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
