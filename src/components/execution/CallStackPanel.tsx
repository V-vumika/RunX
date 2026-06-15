"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";

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

  // stack is outermost-first; show innermost (current) frame on top.
  const frames = [...snapshot.stack].reverse();

  return (
    <ScrollArea className="h-full">
      <ul className="p-2">
        {frames.map((frame, i) => {
          const isCurrent = i === 0;
          const depth = frames.length - 1 - i;
          const label =
            frame.functionName === "<module>"
              ? "<module>"
              : `${frame.functionName}()`;
          return (
            <li
              key={`${frame.functionName}-${depth}-${i}`}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 ${
                isCurrent ? "bg-muted" : ""
              }`}
              style={{ marginLeft: `${Math.min(depth, 8) * 12}px` }}
            >
              <span className="flex items-center gap-2">
                {isCurrent && (
                  <span className="size-1.5 rounded-full bg-amber-400" />
                )}
                <span className="font-mono text-[13px] text-foreground">
                  {label}
                </span>
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                line {frame.line}
              </Badge>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
