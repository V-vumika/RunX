"use client";

import { AlertTriangle } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";

export function OutputPanel() {
  const snapshot = useExecutionStore(selectCurrentSnapshot);
  const result = useExecutionStore((s) => s.result);
  const runError = useExecutionStore((s) => s.runError);
  const hasTrace = useExecutionStore((s) => s.snapshots.length > 0);

  const stdout = snapshot?.stdout ?? "";

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        {runError && (
          <ErrorBox title="Execution engine error" body={runError} />
        )}

        {result?.error && (
          <ErrorBox
            title={`${result.error.type}${
              result.error.line ? ` (line ${result.error.line})` : ""
            }`}
            body={result.error.message}
          />
        )}

        {result?.truncated && (
          <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Trace stopped early at the step limit — the program may contain a
            long-running or infinite loop.
          </div>
        )}

        {!hasTrace && !runError ? (
          <p className="text-sm text-muted-foreground">
            Program output (stdout) will appear here, growing as you step
            through execution.
          </p>
        ) : (
          <pre className="font-mono text-[13px] whitespace-pre-wrap text-foreground">
            {stdout || (
              <span className="text-muted-foreground">
                (no output at this step)
              </span>
            )}
          </pre>
        )}
      </div>
    </ScrollArea>
  );
}

function ErrorBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
        <AlertTriangle className="size-3.5" />
        {title}
      </div>
      <p className="mt-1 font-mono text-[13px] whitespace-pre-wrap text-destructive/90">
        {body}
      </p>
    </div>
  );
}
