"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
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

const SPEED_OPTIONS = [0.5, 1, 2, 4];

export function ExecutionControls() {
  const run          = useExecutionStore((s) => s.run);
  const reset        = useExecutionStore((s) => s.reset);
  const stepForward  = useExecutionStore((s) => s.stepForward);
  const stepBackward = useExecutionStore((s) => s.stepBackward);
  const goToStep     = useExecutionStore((s) => s.goToStep);
  const togglePlay   = useExecutionStore((s) => s.togglePlay);
  const setPlaySpeed = useExecutionStore((s) => s.setPlaySpeed);

  const isRunning    = useExecutionStore((s) => s.isRunning);
  const isPlaying    = useExecutionStore((s) => s.isPlaying);
  const playSpeed    = useExecutionStore((s) => s.playSpeed);
  const currentStep  = useExecutionStore((s) => s.currentStep);
  const stepCount    = useExecutionStore((s) => s.snapshots.length);
  const engineStatus = useExecutionStore((s) => s.engineStatus);
  const snapshot     = useExecutionStore(selectCurrentSnapshot);

  const hasTrace = stepCount > 0;
  const atStart  = currentStep <= 0;
  const atEnd    = currentStep >= stepCount - 1;
  const engineReady = engineStatus === "ready";
  const showFirstRunNudge = engineReady && !hasTrace && !isRunning;

  // Arrow-key stepping
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el  = document.activeElement;
      const tag = el?.tagName.toLowerCase();
      if (tag === "textarea" || tag === "input" || (el as HTMLElement)?.isContentEditable) return;
      if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); stepForward(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); stepBackward(); }
      else if (e.key === " ") { e.preventDefault(); e.stopPropagation(); togglePlay(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [stepForward, stepBackward, togglePlay]);

  return (
    <div className="flex flex-wrap items-center gap-3">

      {/* Run button */}
      <div className="relative">
        {showFirstRunNudge && (
          <motion.span
            className="absolute inset-0 -z-10 rounded-md bg-primary"
            animate={{ opacity: [0.6, 0], scale: [1, 1.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <Button
          onClick={() => run()}
          disabled={isRunning || !engineReady}
          size="sm"
          className="gap-2 rounded-full bg-void-violet text-white shadow-[0_0_18px_rgba(102,58,243,0.35)] hover:bg-[#7248f5]"
          title={engineReady ? undefined : "Waiting for the Python runtime to finish loading…"}
        >
          {isRunning || !engineReady ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {isRunning ? "Running…" : engineReady ? "Run" : "Loading runtime…"}
        </Button>
      </div>

      {/* Step controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="icon"
          onClick={() => goToStep(0)}
          disabled={!hasTrace || atStart}
          title="Jump to start"
          aria-label="Jump to start"
        >
          <SkipBack className="size-4" />
        </Button>
        <Button
          variant="outline" size="icon"
          onClick={stepBackward}
          disabled={!hasTrace || atStart}
          title="Step back (←)"
          aria-label="Step back"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* ── NEW: Play / Pause button ── */}
        <Button
          variant="outline" size="icon"
          onClick={togglePlay}
          disabled={!hasTrace || atEnd}
          title={isPlaying ? "Pause (Space)" : "Auto-play (Space)"}
          aria-label={isPlaying ? "Pause" : "Auto-play"}
        >
          {isPlaying
            ? <Pause className="size-4" />
            : <Play  className="size-4" />}
        </Button>

        <Button
          variant="outline" size="icon"
          onClick={stepForward}
          disabled={!hasTrace || atEnd}
          title="Step forward (→)"
          aria-label="Step forward"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={reset}
          disabled={!hasTrace}
          title="Clear trace"
          aria-label="Clear trace"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      {/* Timeline slider */}
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

      {/* ── NEW: Speed selector ── */}
      {hasTrace && (
        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setPlaySpeed(s)}
              className={`rounded px-2 py-0.5 font-mono text-[11px] transition-colors ${
                playSpeed === s
                  ? "bg-violet-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      )}

      {/* Engine status */}
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
