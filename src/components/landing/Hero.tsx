import { Sparkles } from "lucide-react";

import { LaunchButton } from "./LaunchButton";

/**
 * Landing hero — the thesis of the product in one screen: RunX turns "code → a
 * number" into "code → watch it run". The mock on the right shows the actual
 * idea (a highlighted current line + live variables + an animating structure)
 * so the promise is visible, not just described.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* violet glow + faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(139,124,246,0.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:36px_36px]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-20 md:pt-28 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-mono text-xs text-violet-300">
            <Sparkles className="size-3.5" />
            Python · step-by-step
          </span>

          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            See how your code{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              actually runs.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            RunX runs your Python one line at a time and shows the variables, memory,
            call stack, data structures, and complexity as they change — not just the
            final output.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LaunchButton />
            <a
              href="#showcase"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              See what it visualizes →
            </a>
          </div>

          <p className="mt-5 font-mono text-xs text-muted-foreground/70">
            No signup. Paste Python, press Run.
          </p>
        </div>

        <HeroMock />
      </div>
    </section>
  );
}

/** A stylized snapshot of the workspace: current line, a variable, an animating sort. */
function HeroMock() {
  const lines = [
    "def bubble_sort(a):",
    "    for i in range(len(a)):",
    "        for j in range(len(a)-1-i):",
    "            if a[j] > a[j+1]:",
    "                a[j], a[j+1] = a[j+1], a[j]",
    "    return a",
  ];
  const activeLine = 4;
  const bars = [24, 40, 16, 52, 32]; // heights (%)
  const comparing = [1, 2];

  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-2xl bg-violet-500/10 blur-2xl" aria-hidden />
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <span className="size-3 rounded-full bg-rose-400/70" />
          <span className="size-3 rounded-full bg-amber-400/70" />
          <span className="size-3 rounded-full bg-emerald-400/70" />
          <span className="ml-2 font-mono text-xs text-muted-foreground">main.py</span>
        </div>

        <div className="grid gap-0 sm:grid-cols-[1.4fr_1fr]">
          {/* code */}
          <div className="border-b border-border/50 py-3 font-mono text-[12.5px] leading-relaxed sm:border-b-0 sm:border-r">
            {lines.map((ln, i) => (
              <div
                key={i}
                className={`flex gap-3 px-4 ${
                  i === activeLine ? "bg-amber-300/15" : ""
                }`}
              >
                <span className="w-4 select-none text-right text-muted-foreground/40">{i + 1}</span>
                <span className={i === activeLine ? "text-foreground" : "text-muted-foreground"}>
                  {ln || " "}
                </span>
              </div>
            ))}
          </div>

          {/* live panel */}
          <div className="flex flex-col gap-3 p-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
              swapping
            </div>
            <div className="flex items-end gap-1.5">
              {bars.map((h, i) => {
                const on = comparing.includes(i);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-sm ${on ? "bg-amber-400" : "bg-violet-500/70"}`}
                      style={{ height: `${h + 24}px` }}
                    />
                    <span className="font-mono text-[9px] text-muted-foreground/60">{i}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-1 rounded-md border border-violet-500/25 bg-violet-500/10 px-2.5 py-1.5">
              <div className="font-mono text-[10px] text-muted-foreground">a[j], a[j+1]</div>
              <div className="font-mono text-xs font-medium text-violet-200">52 ↔ 16</div>
            </div>
            <div className="rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5">
              <div className="font-mono text-[10px] text-muted-foreground">complexity</div>
              <div className="font-mono text-xs font-medium text-emerald-300">O(n²)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
