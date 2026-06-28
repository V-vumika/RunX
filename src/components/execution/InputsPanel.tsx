"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FlaskConical } from "lucide-react";

import { useExecutionStore } from "@/lib/store/execution-store";

/**
 * Input editor for "bare solution" code — a pasted `class Solution` or
 * top-level function that nothing calls (the LeetCode case). The store detects
 * this; here the user fills one value per parameter. The call to the entry
 * point is built by the runner (shown read-only below), so it can never be
 * deleted or mistyped.
 *
 * Renders nothing when the code already drives itself (`entry.kind` is
 * `has-driver` / `none`).
 */
export function InputsPanel() {
  const entry = useExecutionStore((s) => s.entry);
  const inputs = useExecutionStore((s) => s.inputs);
  const setInput = useExecutionStore((s) => s.setInput);
  const [open, setOpen] = useState(true);

  const needsInput =
    entry.kind === "class-method" || entry.kind === "free-function";
  if (!needsInput) return null;

  const args = entry.params.join(", ");
  const callPreview =
    entry.kind === "class-method"
      ? `${entry.className}().${entry.functionName}(${args})`
      : `${entry.functionName}(${args})`;

  return (
    <div className="shrink-0 border-t bg-amber-500/3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
        <FlaskConical className="size-3.5 shrink-0 text-amber-400" />
        <span className="shrink-0">Inputs needed</span>
        <code className="ml-1 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground/80">
          {callPreview}
        </code>
      </button>

      {open && (
        <div className="space-y-2 px-3 pb-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            This code only <em>defines</em> a solution — nothing calls it. Enter a
            value for each parameter (as Python, e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">
              [2, 2, 1, 2, 1]
            </code>
            ), then Run.
          </p>

          {entry.params.length === 0 ? (
            <p className="text-[11px] italic text-muted-foreground">
              No parameters — just hit Run.
            </p>
          ) : (
            <div className="space-y-1.5">
              {entry.params.map((p) => (
                <label key={p} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-right font-mono text-xs text-muted-foreground">
                    {p}
                  </span>
                  <span className="shrink-0 text-muted-foreground/50">=</span>
                  <input
                    value={inputs[p] ?? ""}
                    onChange={(e) => setInput(p, e.target.value)}
                    spellCheck={false}
                    placeholder="value…"
                    className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 font-mono text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </label>
              ))}
            </div>
          )}

          <div className="rounded-md border border-dashed bg-muted/30 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="select-none text-muted-foreground/50">runs: </span>
            print({callPreview})
          </div>
        </div>
      )}
    </div>
  );
}
