"use client";

/**
 * MemoryView — draws each variable in the current scope as a "memory box".
 *
 * 🟣 Vumi: this is YOUR component to build out. Right now it's a minimal
 * scaffold that proves the data pipeline works (scope + variables + which
 * objects are shared). Your job is to turn each variable into a nice box and
 * visually connect boxes that point at the SAME object.
 *
 * Everything you need is already wired:
 *   - `snapshot`  → the current step (from the store).
 *   - `variables` → the names + values to draw (each has `.name` and `.value`).
 *   - `aliasMap`  → tells you which values are shared and what color to use:
 *        aliasMap.isShared(node.id)  → true if 2+ names point at this object
 *        aliasMap.infoFor(node.id)   → { id, color, refCount } for that object
 *     Use `color` for the box border / a dot / the connecting arrow so the same
 *     object always gets the same color. `refCount` = how many point at it.
 *
 * Reuse <ValueView node={v.value} /> to render the value text inside a box.
 */

import type { ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";
import { buildAliasMap } from "@/lib/visualizers/aliasing";
import { ValueView } from "@/components/inspector/ValueView";

export function MemoryView() {
  const snapshot = useExecutionStore(selectCurrentSnapshot);
  const hasTrace = useExecutionStore((s) => s.snapshots.length > 0);

  if (!hasTrace) {
    return <EmptyState>Run your code to see variables as memory boxes.</EmptyState>;
  }
  if (!snapshot) return null;

  const frame = snapshot.stack[snapshot.stack.length - 1];
  const variables = frame?.locals ?? [];
  const aliasMap = buildAliasMap(variables);

  if (variables.length === 0) {
    return <EmptyState>No variables in scope at this step.</EmptyState>;
  }

  // ── SCAFFOLD below — Vumi replaces this with the real boxes + arrows. ──
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-wrap gap-3 p-3">
        {variables.map((v) => {
          const alias = aliasMap.infoFor(v.value.id);
          return (
            <div
              key={v.name}
              className="rounded-md border bg-card px-3 py-2"
              style={alias ? { borderColor: alias.color } : undefined}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] font-medium text-sky-300">
                  {v.name}
                </span>
                {alias && (
                  <span
                    className="rounded-sm px-1 text-[10px] font-medium text-black"
                    style={{ backgroundColor: alias.color }}
                    title="This object is shared by multiple variables"
                  >
                    shared ×{alias.refCount}
                  </span>
                )}
              </div>
              <div className="mt-1 wrap-break-word">
                <ValueView node={v.value} />
              </div>
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
