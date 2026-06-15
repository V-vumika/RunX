"use client";

import type { ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";
import { ValueView } from "./ValueView";

export function VariableInspector() {
  const snapshot = useExecutionStore(selectCurrentSnapshot);
  const hasTrace = useExecutionStore((s) => s.snapshots.length > 0);

  if (!hasTrace) {
    return (
      <EmptyState>Run your code to inspect variables step by step.</EmptyState>
    );
  }
  if (!snapshot) return null;

  const frame = snapshot.stack[snapshot.stack.length - 1];
  const variables = frame?.locals ?? [];
  const scopeLabel =
    frame?.functionName === "<module>"
      ? "global scope"
      : `${frame?.functionName ?? "?"}()`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2 text-xs text-muted-foreground">
        Scope:{" "}
        <span className="font-mono text-foreground">{scopeLabel}</span>
      </div>
      <ScrollArea className="flex-1">
        {variables.length === 0 ? (
          <EmptyState>No variables in scope at this step.</EmptyState>
        ) : (
          <ul className="divide-y">
            {variables.map((v) => (
              <li
                key={v.name}
                className="flex items-baseline gap-3 px-3 py-2 hover:bg-muted/40"
              >
                <span className="shrink-0 font-mono text-[13px] font-medium text-sky-300">
                  {v.name}
                </span>
                <span className="text-muted-foreground">=</span>
                <span className="min-w-0 wrap-break-word">
                  <ValueView node={v.value} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
