"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, Terminal } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";

export function OutputPanel() {
  const snapshot  = useExecutionStore(selectCurrentSnapshot);
  const result    = useExecutionStore((s) => s.result);
  const runError  = useExecutionStore((s) => s.runError);
  const hasTrace  = useExecutionStore((s) => s.snapshots.length > 0);

  const stdout = snapshot?.stdout ?? "";

  // ── NEW: copy button state ──
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!stdout) return;
    navigator.clipboard.writeText(stdout).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3">

        {/* ── NEW: header ── */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
            Output
          </span>
          {hasTrace && stdout && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  Copy output
                </>
              )}
            </button>
          )}
        </div>

        {/* errors — unchanged */}
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

        {/* ── NEW: empty state ── */}
        {!hasTrace && !runError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Terminal className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Run your code to see output here.
            </p>
          </div>
        ) : (
          /* ── NEW: output card ── */
          <div className="rounded-lg border bg-muted/40 p-3">
            <pre className="font-mono text-[13px] whitespace-pre-wrap text-foreground">
              {stdout || (
                <span className="text-muted-foreground">
                  (no output at this step)
                </span>
              )}
            </pre>
          </div>
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
