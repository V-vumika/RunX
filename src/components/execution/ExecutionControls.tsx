"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  RotateCcw,
  SkipBack,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  selectCurrentSnapshot,
  useExecutionStore,
} from "@/lib/store/execution-store";

export function ExecutionControls() {
  const run = useExecutionStore((s) => s.run);
  const reset = useExecutionStore((s) => s.reset);
  const stepForward = useExecutionStore((s) => s.stepForward);
  const stepBackward = useExecutionStore((s) => s.stepBackward);
  const goToStep = useExecutionStore((s) => s.goToStep);

  const isRunning = useExecutionStore((s) => s.isRunning);
  const currentStep = useExecutionStore((s) => s.currentStep);
  const stepCount = useExecutionStore((s) => s.snapshots.length);
  const engineStatus = useExecutionStore((s) => s.engineStatus);
  const snapshot = useExecutionStore(selectCurrentSnapshot);

  const hasTrace = stepCount > 0;
  const atStart = currentStep <= 0;
  const atEnd = currentStep >= stepCount - 1;
  const engineReady = engineStatus === "ready";
  // First-run nudge: pulse the Run button until the student has run anything at all.
  const showFirstRunNudge = engineReady && !hasTrace && !isRunning;

  // Arrow-key stepping (ignored while typing in the editor / inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const tag = el?.tagName.toLowerCase();
      if (tag === "textarea" || tag === "input" || (el as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        stepForward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        stepBackward();
      }
    };
    // Capture phase: must run before Radix Tabs' own roving-tabindex arrow
    // handling on a focused tab trigger, or stepping also flips the active tab.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [stepForward, stepBackward]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        {showFirstRunNudge && (
          <motion.span
            className="pointer-events-none absolute inset-0 -z-10 rounded-md bg-primary/50"
            animate={{ opacity: [0.6, 0], scale: [1, 1.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <Button
          onClick={() => run()}
          disabled={isRunning || !engineReady}
          size="sm"
          className="gap-2"
          title={!engineReady ? "Waiting for the Python runtime to finish loading" : undefined}
        >
          {isRunning || !engineReady ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {isRunning ? "Running…" : !engineReady ? "Loading runtime…" : "Run"}
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToStep(0)}
          disabled={!hasTrace || atStart}
          title="Jump to start"
        >
          <SkipBack className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={stepBackward}
          disabled={!hasTrace || atStart}
          title="Step back (←)"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={stepForward}
          disabled={!hasTrace || atEnd}
          title="Step forward (→)"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          disabled={!hasTrace}
          title="Clear trace"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="flex min-w-50 flex-1 items-center gap-3">
        <Slider
          value={[hasTrace ? currentStep : 0]}
          min={0}
          max={hasTrace ? stepCount - 1 : 0}
          step={1}
          disabled={!hasTrace}
          onValueChange={([v]) => goToStep(v)}
          aria-label="Execution step"
        />
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {hasTrace ? `${currentStep + 1} / ${stepCount}` : "0 / 0"}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {snapshot && (
          <Badge variant="secondary" className="font-mono">
            line {snapshot.line}
          </Badge>
        )}
        <EngineIndicator status={engineStatus} />
      </div>
    </div>
  );
}

function EngineIndicator({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-emerald-500" />
        Engine ready
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-destructive">
        <span className="size-2 rounded-full bg-destructive" />
        Engine error
      </span>
    );
  }
  if (status === "loading") {
    return (
      <span className="flex items-center gap-1.5">
        <Loader2 className="size-3 animate-spin" />
        Loading Python runtime…
      </span>
    );
  }
  return null;
}
