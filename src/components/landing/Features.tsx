import { StepForward, Boxes, Network, Gauge } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: StepForward,
    title: "Step through every line",
    body: "Play, pause, or step forward and back. The current line, the call stack, and every variable update in lockstep as execution moves.",
  },
  {
    icon: Boxes,
    title: "Memory you can see",
    body: "Variables render as boxes, and shared references are drawn between them — so aliasing and mutation bugs become obvious instead of invisible.",
  },
  {
    icon: Network,
    title: "20+ DSA visualizers",
    body: "Arrays, stacks, queues, linked lists, trees, tries, graphs, heaps, DP tables, union-find, segment trees — auto-detected from your code, no setup.",
  },
  {
    icon: Gauge,
    title: "Complexity, decided by rules",
    body: "Big-O comes from real loop-nesting and recursion analysis — never guessed — alongside the operations actually measured on your run.",
  },
];

/** The four pillars of what RunX shows beyond a program's output. */
export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
      <div className="max-w-2xl">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Output tells you <span className="text-muted-foreground">what</span>. RunX shows you{" "}
          <span className="text-violet-400">how</span>.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Everything that happens between pressing Run and getting an answer — made visible.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-violet-500/40"
          >
            <div className="flex size-11 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 transition-colors group-hover:bg-violet-500/15">
              <Icon className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
