"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Play, SkipBack, SkipForward } from "lucide-react";

import { HeroBackdrop } from "./authkit/HeroBackdrop";
import { ParticleField } from "./authkit/ParticleField";
import { Reveal } from "./authkit/Reveal";

/**
 * Hero reverse-engineered from the AuthKit reference: a framed blueprint grid lit
 * by a wide diffused beam and a single luminous gradient wordmark. Below the
 * headline sits a large, self-playing execution dashboard — the product shot that
 * proves the "watch your code run" promise.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#080b17] pb-24 sm:pb-28">
      <ParticleField />
      <HeroBackdrop />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-32 text-center sm:pt-40">
        <Reveal>
          <div className="flex items-center justify-center gap-5">
            <span aria-hidden className="h-px w-14 bg-linear-to-l from-hairline to-transparent sm:w-24" />
            <p className="whitespace-nowrap text-sm font-medium tracking-[0.02em] text-fog">
              Now running in your browser
            </p>
            <span aria-hidden className="h-px w-14 bg-linear-to-r from-hairline to-transparent sm:w-24" />
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="ak-skywash mt-8 font-display font-medium leading-[0.85] tracking-[-0.03em] text-[clamp(4.5rem,14vw,11rem)]">
            RunX
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mx-auto mt-6 max-w-md text-pretty text-lg leading-relaxed text-mist">
            See how your code actually runs — every line, every variable, every step, drawn as it happens.
          </p>
        </Reveal>
      </div>

      {/* The product shot: a big execution dashboard, in normal hero flow. */}
      <div className="relative z-10 mt-16 px-6">
        <ExecutionDashboard />
      </div>
    </section>
  );
}

/* ─────────────────────────── Execution dashboard ─────────────────────────── */

const CODE = [
  "def bubble_sort(a):",
  "  for i in range(len(a)):",
  "    for j in range(len(a)-1-i):",
  "      if a[j] > a[j+1]:",
  "        a[j], a[j+1] = a[j+1], a[j]",
  "  return a",
];

const START = [46, 18, 72, 30, 60, 12, 52, 38];
const MAXV = 72;
const TOTAL = (START.length * (START.length - 1)) / 2; // comparisons per pass

type Bar = { id: number; v: number };
type Snap = { bars: Bar[]; cmp: [number, number]; active: number; step: number; i: number; va: number; vb: number };

function makeBars(pass: number): Bar[] {
  const vals = pass === 0 ? START : [...START].sort(() => Math.random() - 0.5);
  return vals.map((v, k) => ({ id: pass * 100 + k, v }));
}

const REST: Snap = { bars: makeBars(0), cmp: [2, 3], active: 3, step: 6, i: 0, va: START[2], vb: START[3] };

/**
 * A wide, self-playing execution frame styled like the real RunX workspace. One
 * bubble-sort trace drives everything on a single beat — the active code line,
 * the comparing bars, the live variables, the complexity readout and the step
 * timeline all advance together, so a visitor literally watches code run. Falls
 * back to a static frame under prefers-reduced-motion.
 */
function ExecutionDashboard() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: "0px 0px -10% 0px" });
  const [snap, setSnap] = useState<Snap>(REST);
  const machine = useRef({ arr: makeBars(0), i: 0, j: 0, step: 1, pass: 0 });

  useEffect(() => {
    if (reduce || !inView) return;
    const id = setInterval(() => {
      const m = machine.current;
      const { i, j } = m;
      const va = m.arr[j].v;
      const vb = m.arr[j + 1].v;
      const willSwap = va > vb;
      if (willSwap) [m.arr[j], m.arr[j + 1]] = [m.arr[j + 1], m.arr[j]];

      setSnap({ bars: [...m.arr], cmp: [j, j + 1], active: willSwap ? 4 : 3, step: m.step, i, va, vb });

      // Advance one comparison; wrap the loops, reshuffle when a pass finishes.
      let nj = j + 1;
      let ni = i;
      if (nj >= m.arr.length - 1 - i) {
        nj = 0;
        ni = i + 1;
      }
      if (ni >= m.arr.length - 1) {
        m.pass += 1;
        m.arr = makeBars(m.pass);
        m.i = 0;
        m.j = 0;
        m.step = 1;
      } else {
        m.i = ni;
        m.j = nj;
        m.step += 1;
      }
    }, 720);
    return () => clearInterval(id);
  }, [reduce, inView]);

  const progress = Math.round((snap.step / TOTAL) * 100);
  const vars: [string, number][] = [
    ["i", snap.i],
    ["j", snap.cmp[0]],
    ["a[j]", snap.va],
    ["a[j+1]", snap.vb],
  ];

  return (
    <Reveal delay={0.28} className="relative mx-auto w-full max-w-6xl">
      {/* Violet bloom behind the frame. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -top-12 bottom-8 -z-10 rounded-[44px] bg-[radial-gradient(ellipse_at_center,rgba(102,58,243,0.2),transparent_70%)] blur-2xl"
      />

      <div
        ref={rootRef}
        className="ak-glass-deep ak-rimlight overflow-hidden rounded-2xl border border-[rgba(186,215,247,0.12)] shadow-[0_50px_130px_-40px_rgba(2,3,10,0.95)]"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-[rgba(186,215,247,0.08)] bg-[rgba(199,211,234,0.02)] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[rgba(228,109,76,0.7)]" />
            <span className="size-2.5 rounded-full bg-[rgba(216,236,248,0.5)]" />
            <span className="size-2.5 rounded-full bg-[rgba(38,150,132,0.7)]" />
          </div>
          <span className="ml-1 font-mono text-[11px] text-fog">bubble_sort.py — RunX</span>
          <span className="ml-auto rounded-full border border-[rgba(155,140,247,0.28)] bg-[rgba(102,58,243,0.12)] px-2.5 py-1 font-mono text-[10px] text-[#b8a9fb]">
            Python
          </span>
          <span className="hidden items-center gap-1.5 rounded-full bg-void-violet px-3 py-1 text-[11px] font-medium text-white shadow-[0_0_16px_rgba(102,58,243,0.45)] sm:inline-flex">
            <span className="size-1.5 animate-pulse rounded-full bg-white/90" /> Running
          </span>
        </div>

        {/* Body: code · visualization · inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)_minmax(0,0.9fr)]">
          {/* Code editor + live console output */}
          <div className="flex flex-col border-b border-[rgba(186,215,247,0.08)] lg:border-b-0 lg:border-r">
            <PanelLabel>main.py</PanelLabel>
            <div className="py-4 font-mono text-[13px] leading-[2.3]">
              {CODE.map((ln, idx) => {
                const on = idx === snap.active;
                return (
                  <div key={idx} className={`relative flex gap-3 px-4 ${on ? "bg-[rgba(102,58,243,0.1)]" : ""}`}>
                    {on && <span className="absolute inset-y-0 left-0 w-0.5 bg-[#9b8cf7]" />}
                    <span className={`w-4 select-none text-right ${on ? "text-[#b8a9fb]" : "text-fog/60"}`}>
                      {idx + 1}
                    </span>
                    <span className={`whitespace-pre transition-colors ${on ? "text-frost" : "text-fog"}`}>{ln}</span>
                  </div>
                );
              })}
            </div>

            {/* Console fills the remaining height and mirrors the array as text. */}
            <div className="mt-auto border-t border-[rgba(186,215,247,0.08)] bg-[rgba(199,211,234,0.02)] px-4 py-3.5 font-mono text-[11px] leading-relaxed">
              <p className="text-fog/70">$ python bubble_sort.py</p>
              <p className="mt-2 break-all text-mist">
                <span className="text-fog/50">a = </span>[{snap.bars.map((b) => b.v).join(", ")}]
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[#7fd7c0]">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-[#7fd7c0]" />
                sorting… step {snap.step} / {TOTAL}
              </p>
            </div>
          </div>

          {/* Visualization */}
          <div className="border-b border-[rgba(186,215,247,0.08)] lg:border-b-0 lg:border-r">
            <PanelLabel>Visualization · sorting</PanelLabel>
            <div className="flex h-[460px] flex-col px-5 pb-5 pt-4">
              <div className="flex flex-1 items-end justify-center gap-2.5">
                {snap.bars.map((b, idx) => {
                  const active = idx === snap.cmp[0] || idx === snap.cmp[1];
                  return (
                    <motion.div
                      key={b.id}
                      layout
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      className="flex w-8 flex-col items-center gap-1.5"
                    >
                      <div
                        className={`w-full rounded-t-md ${
                          active
                            ? "bg-linear-to-t from-void-violet to-[#9b8cf7] shadow-[0_0_14px_rgba(102,58,243,0.55)]"
                            : "bg-[rgba(199,211,234,0.16)]"
                        }`}
                        style={{ height: `${24 + (b.v / MAXV) * 330}px` }}
                      />
                      <span className={`font-mono text-[10px] ${active ? "text-[#cdbffb]" : "text-fog/70"}`}>{b.v}</span>
                    </motion.div>
                  );
                })}
              </div>
              <p className="mt-3 text-center font-mono text-[11px] text-fog">
                comparing a[{snap.cmp[0]}] and a[{snap.cmp[1]}]
              </p>
            </div>
          </div>

          {/* Inspector: variables + complexity */}
          <div className="flex flex-col">
            <PanelLabel>Variables</PanelLabel>
            <div className="grid grid-cols-2 gap-2 px-4 py-3">
              {vars.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-lg border border-[rgba(186,215,247,0.08)] bg-[rgba(199,211,234,0.04)] px-3 py-2"
                >
                  <span className="font-mono text-[11px] text-mist">{k}</span>
                  <FlipValue value={v} />
                </div>
              ))}
            </div>

            <div className="mt-auto border-t border-[rgba(186,215,247,0.08)] px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/70">Time complexity</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold text-[#7fd7c0]">O(n²)</span>
                <span className="font-mono text-[10px] text-fog">2 nested loops</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline / playback */}
        <div className="flex items-center gap-3 border-t border-[rgba(186,215,247,0.08)] bg-[rgba(199,211,234,0.02)] px-4 py-3">
          <div className="flex items-center gap-1.5 text-fog">
            <SkipBack className="size-3.5" strokeWidth={1.5} />
            <span className="flex size-6 items-center justify-center rounded-full bg-[rgba(102,58,243,0.2)] text-[#b8a9fb]">
              <Play className="size-3" fill="currentColor" strokeWidth={0} />
            </span>
            <SkipForward className="size-3.5" strokeWidth={1.5} />
          </div>
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[rgba(186,215,247,0.1)]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-void-violet to-[#9b8cf7]"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.3 }}
            />
          </div>
          <span className="whitespace-nowrap font-mono text-[10px] text-fog">
            step {snap.step} / {TOTAL}
          </span>
        </div>
      </div>
    </Reveal>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-[rgba(186,215,247,0.06)] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fog/70">
      {children}
    </div>
  );
}

/** A numeric value that flips up when it changes. */
function FlipValue({ value }: { value: number }) {
  return (
    <span className="relative inline-flex min-w-[16px] justify-end overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="font-mono text-[12px] font-semibold text-frost"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
