import { StepForward, Boxes, Layers, Network, Gauge, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Eyebrow } from "./authkit/Eyebrow";
import { GlassCard } from "./authkit/GlassCard";

const TILES: { icon: LucideIcon; label: string }[] = [
  { icon: StepForward, label: "Step" },
  { icon: Boxes, label: "Memory" },
  { icon: Layers, label: "Call stack" },
  { icon: Network, label: "Structures" },
  { icon: Gauge, label: "Complexity" },
  { icon: Share2, label: "Share" },
];

const CARDS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: StepForward,
    title: "Step through every line",
    body: "Play, pause, or move one line at a time. The current line, the call stack, and every variable update together as you go.",
  },
  {
    icon: Boxes,
    title: "Memory you can see",
    body: "Variables render as boxes, and shared references get drawn between them, so aliasing and mutation bugs stop hiding.",
  },
  {
    icon: Network,
    title: "Twenty visualizers, auto chosen",
    body: "Arrays, trees, tries, graphs, heaps, DP tables, union find, segment trees. RunX reads your code and opens the right one.",
  },
  {
    icon: Gauge,
    title: "Complexity from real analysis",
    body: "Big O comes from actual loop nesting and recursion shape, never guessed, next to the operations measured on your run.",
  },
];

/** The pillars of what RunX shows beyond a program's output. */
export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      {/* icon-tile timeline */}
      <div className="flex items-start justify-center gap-1 sm:gap-3">
        {TILES.map(({ icon: Icon, label }, i) => (
          <div key={label} className="flex items-center gap-1 sm:gap-3">
            <div className="flex flex-col items-center gap-2.5">
              <div className="ak-glass ak-hairline flex size-13 items-center justify-center rounded-full text-frost sm:size-14">
                <Icon className="size-5" strokeWidth={1.5} />
              </div>
              <span className="font-mono text-[10px] text-mist sm:text-[11px]">{label}</span>
            </div>
            {i < TILES.length - 1 && (
              <span className="mb-7 hidden h-px w-5 bg-[rgba(186,215,247,0.16)] sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* heading */}
      <div className="mx-auto mt-20 max-w-2xl text-center">
        <Eyebrow>What you see</Eyebrow>
        <h2 className="mt-6 text-balance font-display text-[2rem] font-medium leading-[1.1] tracking-tight text-frost sm:text-[2.75rem]">
          Output tells you <span className="text-fog">what</span>.
          <br />
          RunX shows you <span className="ak-skywash">how</span>.
        </h2>
        <p className="mt-5 text-pretty text-base leading-relaxed text-mist sm:text-[17px]">
          Everything that happens between pressing Run and getting an answer, made visible.
        </p>
      </div>

      {/* detail cards */}
      <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2">
        {CARDS.map(({ icon: Icon, title, body }) => (
          <GlassCard key={title} className="p-6">
            <div className="ak-hairline flex size-11 items-center justify-center rounded-full bg-[rgba(102,58,243,0.12)] text-[#b8a9fb]">
              <Icon className="size-5" strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-frost">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
