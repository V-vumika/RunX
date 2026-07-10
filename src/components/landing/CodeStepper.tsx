"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, Gauge } from "lucide-react";

/**
 * The hero's living product demo: a scripted trace of a binary search that plays
 * itself, so a visitor sees RunX "run" before touching the app. The current line
 * slides via a shared layout highlight, variable chips pop when they change, the
 * array window/mid/found states animate, and a note explains each step. Fully
 * interactive (play/pause, step, scrub) and holds a representative frame under
 * prefers-reduced-motion.
 */

const C = {
  kw: "text-fuchsia-300",
  fn: "text-cyan-300",
  num: "text-orange-300",
  op: "text-white/40",
  id: "text-white/85",
} as const;

type Tok = readonly [string, string];

const CODE: Tok[][] = [
  [["def ", C.kw], ["binary_search", C.fn], ["(", C.op], ["nums, target", C.id], ["):", C.op]],
  [["    lo, hi ", C.id], ["= ", C.op], ["0", C.num], [", ", C.op], ["len", C.fn], ["(", C.op], ["nums", C.id], [") - ", C.op], ["1", C.num]],
  [["    ", C.id], ["while ", C.kw], ["lo <= hi", C.id], [":", C.op]],
  [["        mid ", C.id], ["= ", C.op], ["(lo + hi) ", C.id], ["// ", C.op], ["2", C.num]],
  [["        ", C.id], ["if ", C.kw], ["nums", C.id], ["[mid] ", C.op], ["== ", C.op], ["target", C.id], [":", C.op]],
  [["            ", C.id], ["return ", C.kw], ["mid", C.id]],
  [["        ", C.id], ["elif ", C.kw], ["nums", C.id], ["[mid] ", C.op], ["< ", C.op], ["target", C.id], [":", C.op]],
  [["            lo ", C.id], ["= ", C.op], ["mid + ", C.id], ["1", C.num]],
];

const ARRAY = [2, 5, 8, 12, 16, 23, 38, 56];
const TARGET = 23;

type Step = { line: number; lo: number; hi: number; mid: number | null; found?: boolean; note: string };

const STEPS: Step[] = [
  { line: 1, lo: 0, hi: 7, mid: null, note: "Read the bounds of the array" },
  { line: 3, lo: 0, hi: 7, mid: 3, note: "Midpoint of 0…7 is index 3" },
  { line: 6, lo: 0, hi: 7, mid: 3, note: "nums[3] = 12 is less than 23" },
  { line: 7, lo: 4, hi: 7, mid: 3, note: "Search moves right → lo = 4" },
  { line: 3, lo: 4, hi: 7, mid: 5, note: "Midpoint of 4…7 is index 5" },
  { line: 5, lo: 4, hi: 7, mid: 5, found: true, note: "nums[5] = 23 — found it!" },
];

function cellRole(i: number, s: Step): "found" | "mid" | "window" | "out" {
  if (s.found && i === s.mid) return "found";
  if (i === s.mid) return "mid";
  if (i >= s.lo && i <= s.hi) return "window";
  return "out";
}

const CELL: Record<string, string> = {
  found: "border-emerald-400/70 bg-emerald-400/15 text-emerald-200",
  mid: "border-cyan-400/70 bg-cyan-400/20 text-cyan-100",
  window: "border-white/15 bg-white/6 text-white/75",
  out: "border-white/5 bg-transparent text-white/25",
};

export function CodeStepper() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(reduce ? 4 : 0);
  const [playing, setPlaying] = useState(!reduce);
  const step = STEPS[i];

  const go = useCallback((n: number) => setI((prev) => (n + STEPS.length) % STEPS.length), []);

  useEffect(() => {
    if (!playing || reduce) return;
    const id = setInterval(() => setI((p) => (p + 1) % STEPS.length), 1700);
    return () => clearInterval(id);
  }, [playing, reduce]);

  return (
    <div className="relative w-full">
      <div aria-hidden className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-cyan-500/15 blur-3xl" />

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#070b14]/85 shadow-2xl shadow-black/60 backdrop-blur-md">
        {/* Chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="ml-3 font-mono text-[11px] text-white/40">binary_search.py</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
            <span className="size-1.5 animate-pulse rounded-full bg-cyan-400" />
            {step.found ? "Done" : "Running"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
          {/* Code */}
          <div className="overflow-x-auto border-b border-white/10 py-3 font-mono text-[12px] leading-[1.75] md:border-b-0 md:border-r">
            {CODE.map((toks, idx) => {
              const active = idx === step.line;
              return (
                <div key={idx} className="relative flex whitespace-pre px-3">
                  {active && (
                    <motion.div
                      layoutId={reduce ? undefined : "line-highlight"}
                      className="absolute inset-y-0 left-0 right-0 border-l-2 border-cyan-400 bg-cyan-400/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative mr-3 w-4 shrink-0 select-none text-right text-white/20">{idx + 1}</span>
                  <code className="relative">
                    {toks.map(([t, c], j) => (
                      <span key={j} className={c}>
                        {t}
                      </span>
                    ))}
                  </code>
                </div>
              );
            })}
          </div>

          {/* Inspector */}
          <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip name="lo" value={step.lo} />
              <Chip name="hi" value={step.hi} />
              <Chip name="mid" value={step.mid ?? "—"} active />
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-orange-400/20 bg-orange-400/10 px-2 py-1 font-mono text-[11px]">
                <span className="text-white/50">target</span>
                <span className="text-white/30">=</span>
                <span className="text-orange-300">{TARGET}</span>
              </span>
            </div>

            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">nums</p>
              <div className="flex gap-1">
                {ARRAY.map((n, idx) => {
                  const role = cellRole(idx, step);
                  return (
                    <div
                      key={idx}
                      className={`flex size-7 items-center justify-center rounded-md border text-[11px] font-medium transition-all duration-300 ${CELL[role]}`}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
              <div className="mt-1.5 flex gap-1 font-mono text-[9px]">
                {ARRAY.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-7 text-center transition-colors ${idx === step.mid ? "text-cyan-300" : "text-white/25"}`}
                  >
                    {idx === step.mid ? "mid" : idx}
                  </span>
                ))}
              </div>
            </div>

            {/* Step note */}
            <div className="min-h-[2.5rem] rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <AnimatePresence mode="wait">
                <motion.p
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="text-[13px] font-light text-white/75"
                >
                  {step.note}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                <Gauge className="size-3.5 text-cyan-300" strokeWidth={1.5} />
                Time
              </span>
              <span className="font-mono text-sm font-semibold text-white">O(log n)</span>
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-4 py-2.5">
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => setPlaying((p) => !p)}
            className="flex size-7 items-center justify-center rounded-full bg-linear-to-r from-cyan-500 to-sky-600 text-white transition-transform hover:scale-105"
          >
            {playing ? <Pause className="size-3.5 fill-current" strokeWidth={0} /> : <Play className="size-3.5 fill-current" strokeWidth={0} />}
          </button>
          <button
            type="button"
            aria-label="Previous step"
            onClick={() => { setPlaying(false); go(i - 1); }}
            className="flex size-7 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:text-white"
          >
            <ChevronLeft className="size-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Next step"
            onClick={() => { setPlaying(false); go(i + 1); }}
            className="flex size-7 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:text-white"
          >
            <ChevronRight className="size-3.5" strokeWidth={2} />
          </button>

          <div className="ml-1 flex flex-1 items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to step ${idx + 1}`}
                onClick={() => { setPlaying(false); setI(idx); }}
                className="group h-2 flex-1"
              >
                <span
                  className={`block h-1 rounded-full transition-colors ${idx <= i ? "bg-cyan-400" : "bg-white/12 group-hover:bg-white/25"}`}
                />
              </button>
            ))}
          </div>

          <span className="font-mono text-[10px] text-white/40">
            step {i + 1} / {STEPS.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function Chip({ name, value, active }: { name: string; value: number | string; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] ${
        active ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-white/5"
      }`}
    >
      <span className={active ? "text-cyan-200" : "text-white/50"}>{name}</span>
      <span className="text-white/30">=</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 24 }}
          className="text-orange-300"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
