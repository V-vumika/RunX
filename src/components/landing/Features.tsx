import { Fragment } from "react";
import { StepForward, Boxes, Layers, Network, Gauge, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Eyebrow } from "./authkit/Eyebrow";
import { GlassCard } from "./authkit/GlassCard";
import { Reveal } from "./authkit/Reveal";

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
      {/* icon-tile timeline with marching-dash connectors */}
      <div className="flex items-start justify-center gap-1.5 sm:gap-2">
        {TILES.map(({ icon: Icon, label }, i) => (
          <Fragment key={label}>
            <Reveal delay={i * 0.07} className="flex flex-col items-center gap-3">
              <div className="ak-glass ak-hairline group/tile relative flex size-14 items-center justify-center rounded-full text-frost transition-colors hover:text-white sm:size-16">
                <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(102,58,243,0.3),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover/tile:opacity-100" />
                <Icon className="relative size-5 sm:size-6" strokeWidth={1.5} />
              </div>
              <span className="font-mono text-[10px] text-mist sm:text-[11px]">{label}</span>
            </Reveal>
            {i < TILES.length - 1 && (
              <span className="ak-connector mt-7 hidden w-7 shrink-0 sm:mt-8 sm:block sm:w-14" />
            )}
          </Fragment>
        ))}
      </div>

      {/* heading */}
      <Reveal className="mx-auto mt-20 max-w-2xl text-center">
        <Eyebrow>What you see</Eyebrow>
        <h2 className="mt-6 text-balance font-display text-[2rem] font-medium leading-[1.1] tracking-tight text-frost sm:text-[2.75rem]">
          Output tells you <span className="text-fog">what</span>.
          <br />
          RunX shows you <span className="ak-skywash">how</span>.
        </h2>
        <p className="mt-5 text-pretty text-base leading-relaxed text-mist sm:text-[17px]">
          Everything that happens between pressing Run and getting an answer, made visible.
        </p>
      </Reveal>

      {/* detail cards */}
      <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2">
        {CARDS.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={(i % 2) * 0.1}>
            <GlassCard className="h-full p-6 transition-transform duration-300 hover:-translate-y-1">
              <div className="ak-hairline flex size-11 items-center justify-center rounded-full bg-[rgba(102,58,243,0.12)] text-[#b8a9fb]">
                <Icon className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-frost">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
