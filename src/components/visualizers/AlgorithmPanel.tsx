"use client";

/**
 * AlgorithmPanel — Phase 6 dispatcher. Finds array-kind variables in the
 * current frame and renders each through SortBarsView with the current
 * step's compare/swap highlight (src/lib/visualizers/sort-trace.ts).
 */

import type { ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";
import { detectStructure } from "@/lib/visualizers/structure-detect";
import { computeSortHighlight } from "@/lib/visualizers/sort-trace";
import { SortBarsView } from "./SortBarsView";

export function AlgorithmPanel() {
  const snapshot = useExecutionStore(selectCurrentSnapshot);
  const hasTrace = useExecutionStore((s) => s.snapshots.length > 0);
  const code = useExecutionStore((s) => s.code);
  const prevSnapshot = useExecutionStore((s) =>
    s.currentStep > 0 ? s.snapshots[s.currentStep - 1] : null
  );

  if (!hasTrace) {
    return (
      <EmptyState>
        Run a sorting or search algorithm (try the Bubble Sort or Linear
        Search example) to see this view.
      </EmptyState>
    );
  }
  if (!snapshot) return null;

  const currFrame = snapshot.stack.at(-1);
  const prevFrame = prevSnapshot?.stack.at(-1) ?? null;
  const variables = currFrame?.locals.filter((v) => !v.name.startsWith("__")) ?? [];
  const arrayVars = variables.filter((v) => detectStructure(v.name, v.value) === "array");

  if (arrayVars.length === 0) {
    return (
      <EmptyState>
        No array variables in scope at this step. Try the Bubble Sort or
        Linear Search example.
      </EmptyState>
    );
  }

  const currentLine = code.split("\n")[snapshot.line - 1] ?? "";

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 p-3">
        {arrayVars.map((v) => {
          const prevValue = prevFrame?.locals.find((pv) => pv.name === v.name)?.value ?? null;
          const highlight = computeSortHighlight(
            v.name,
            v.value,
            prevValue,
            currentLine,
            currFrame?.locals ?? []
          );
          return (
            <SortBarsView
              key={v.name}
              name={v.name}
              node={v.value}
              compared={highlight.compared}
              swapped={highlight.swapped}
            />
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
