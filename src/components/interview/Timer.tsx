"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, TimerReset } from "lucide-react";

/**
 * A simple elapsed-time stopwatch for interview practice. Starts counting on
 * mount; the parent remounts this with a fresh `key` per problem so switching
 * problems resets the clock without any manual wiring.
 */
export function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1">
      <span className="font-mono text-xs tabular-nums text-foreground">
        {mm}:{ss}
      </span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        title={running ? "Pause timer" : "Resume timer"}
        aria-label={running ? "Pause timer" : "Resume timer"}
        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        {running ? <Pause className="size-3" /> : <Play className="size-3" />}
      </button>
      <button
        type="button"
        onClick={() => setSeconds(0)}
        title="Reset timer"
        aria-label="Reset timer"
        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <TimerReset className="size-3" />
      </button>
    </div>
  );
}
