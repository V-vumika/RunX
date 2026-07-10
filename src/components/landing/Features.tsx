import { StepForward, Boxes, Network, Gauge } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Eyebrow } from "./authkit/Eyebrow";
import { GlassCard } from "./authkit/GlassCard";
import { Reveal } from "./authkit/Reveal";
import { FeatureTimeline } from "./authkit/FeatureTimeline";
import { PixelCanvas } from "@/components/ui/pixel-canvas";

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
      {/* animated execution-pulse timeline */}
      <FeatureTimeline />

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
            <GlassCard
              deep
              className="group relative h-full overflow-hidden p-6 transition-colors duration-300 hover:ring-1 hover:ring-[rgba(102,58,243,0.4)]"
            >
              {/* Shimmering pixel field that blooms on hover. */}
              <PixelCanvas gap={9} speed={30} colors={["#9b8cf7", "#4FABFF", "#7de3ff"]} variant="icon" />
              <div className="relative z-10">
                <div className="ak-hairline flex size-11 items-center justify-center rounded-full bg-[rgba(102,58,243,0.14)] text-[#b8a9fb] transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-5" strokeWidth={1.5} />
                </div>
                <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-frost">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
