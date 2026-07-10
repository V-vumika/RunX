"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";

import { useExecutionStore } from "@/lib/store/execution-store";
import { usesStdin } from "@/lib/execution/support-check";

/**
 * Standard-input editor. Shown only when the code reads stdin (Python:
 * `input()` / `sys.stdin`; JavaScript: `prompt()` / `readline()`). The text
 * here is fed to the program line by line, so input-reading programs run
 * instead of hanging.
 */
export function StdinPanel() {
  const code = useExecutionStore((s) => s.code);
  const language = useExecutionStore((s) => s.language);
  const stdin = useExecutionStore((s) => s.stdin);
  const setStdin = useExecutionStore((s) => s.setStdin);
  const [open, setOpen] = useState(true);

  if (!usesStdin(code, language)) return null;

  const readFn = language === "javascript" ? "prompt()" : "input()";

  const rows = Math.min(8, Math.max(3, stdin.split("\n").length));

  return (
    <div className="shrink-0 border-t bg-sky-500/3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
        <Terminal className="size-3.5 shrink-0 text-sky-400" />
        <span className="shrink-0">Standard input</span>
        <span className="ml-1 truncate font-normal text-muted-foreground/50">this code reads {readFn}</span>
      </button>

      {open && (
        <div className="px-3 pb-3">
          <p className="mb-1.5 text-[11px] leading-relaxed text-muted-foreground">
            One value per line — each <code className="rounded bg-muted px-1 py-0.5 font-mono">{readFn}</code> call
            reads the next line.
          </p>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            spellCheck={false}
            rows={rows}
            placeholder={"5\n1 2 3 4 5"}
            className="w-full resize-y rounded-md border bg-background px-2.5 py-2 font-mono text-xs leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      )}
    </div>
  );
}
