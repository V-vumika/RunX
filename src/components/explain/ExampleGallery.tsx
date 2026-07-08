"use client";

import { useExecutionStore } from "@/lib/store/execution-store";
import { EXAMPLES } from "@/lib/examples";

/**
 * Example gallery — one-click starter programs shown in the Explain empty state.
 * Loading a card drops its code into the editor and, if the engine is ready,
 * runs it immediately so the visualizer lights up without any typing.
 */
export function ExampleGallery() {
  const setCode = useExecutionStore((s) => s.setCode);
  const run = useExecutionStore((s) => s.run);
  const engineReady = useExecutionStore((s) => s.engineStatus === "ready");

  const load = (code: string) => {
    setCode(code);
    if (engineReady) void run();
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {EXAMPLES.map((ex) => (
        <button
          key={ex.id}
          onClick={() => load(ex.code)}
          className="rounded-md border border-border/60 bg-muted/20 p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
        >
          <div className="text-xs font-medium text-foreground">{ex.title}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{ex.blurb}</div>
        </button>
      ))}
    </div>
  );
}
