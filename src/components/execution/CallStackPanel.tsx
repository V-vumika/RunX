"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";
import { enrichFrames, frameLabel } from "@/lib/visualizers/stack-analysis";

export function CallStackPanel() {
  const snapshot = useExecutionStore(selectCurrentSnapshot);
  const hasTrace = useExecutionStore((s) => s.snapshots.length > 0);

  if (!hasTrace || !snapshot) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        The call stack appears here as your code runs.
      </div>
    );
  }

  // snapshot.stack is outermost-first; show innermost (current) frame on top.
  const enriched = enrichFrames(snapshot.stack).slice().reverse();

  return (
    <ScrollArea className="h-full">
      <ul className="flex flex-col gap-1.5 p-3">
        {enriched.map((ef, i) => {
          // outermost frame = least indent, innermost (active) frame = most indent
          const depth = enriched.length - 1 - i;
          const label = frameLabel(ef.frame);

          return (
            <li
              key={`${ef.frame.functionName}-${depth}-${i}`}
              style={{ marginLeft: `${Math.min(depth, 8) * 16}px` }}
            >
              <div
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                  ef.isActive
                    ? "border-amber-400/60 bg-muted shadow-sm"
                    : "border-border/60 bg-background/40"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${
                      ef.isActive ? "bg-amber-400" : "bg-transparent"
                    }`}
                  />
                  <span
                    className={`truncate font-mono text-[13px] ${
                      ef.isActive
                        ? "font-semibold text-foreground"
                        : "text-foreground/80"
                    }`}
                  >
                    {label}
                  </span>
                  {ef.isRecursive && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 font-mono text-[10px]"
                    >
                      call #{ef.recursionIndex}
                    </Badge>
                  )}
                </span>

                <span className="flex shrink-0 items-center gap-1.5">
                  {ef.localCount > 0 && (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {ef.localCount} {ef.localCount === 1 ? "var" : "vars"}
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-mono text-[10px]">
                    line {ef.frame.line}
                  </Badge>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
