"use client";

import { motion } from "framer-motion";
import { StepForward, Boxes, Gauge, Network, Globe } from "lucide-react";

import { Pill, GradientText, SectionGlow } from "./kit";

const cardBase =
  "group relative overflow-hidden rounded-2xl border border-[rgba(186,215,247,0.1)] bg-[rgba(186,214,247,0.03)] p-6 backdrop-blur-sm transition-colors duration-300 hover:border-[rgba(155,140,247,0.35)] hover:bg-[rgba(186,214,247,0.05)]";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

/** What RunX shows beyond a program's output, as an animated bento grid. */
export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 border-t border-[rgba(186,215,247,0.07)]">
      <SectionGlow />
      <div className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <motion.div className="mx-auto max-w-2xl text-center" {...reveal} transition={{ duration: 0.6 }}>
          <div className="flex justify-center">
            <Pill>What you see</Pill>
          </div>
          <h2 className="mt-6 font-display text-4xl font-medium leading-[1.1] tracking-tight text-frost sm:text-5xl">
            Output tells you <span className="text-fog">what</span>.
            <br />
            RunX shows you <GradientText className="font-medium">how</GradientText>.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-mist sm:text-lg">
            Everything that happens between pressing Run and getting an answer, made visible.
          </p>
        </motion.div>

        <div className="mt-16 grid auto-rows-fr gap-4 md:grid-cols-3">
          {/* Large: step through */}
          <motion.div
            className={`${cardBase} md:col-span-2 md:row-span-2`}
            {...reveal}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4 }}
          >
            <IconBadge icon={StepForward} />
            <h3 className="mt-4 font-display text-xl font-medium tracking-tight text-frost">Step through every line</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-mist">
              Play, pause, or move one line at a time. The current line, the call stack, and every variable update
              together as you go — forwards and back.
            </p>
            <StepMotif />
          </motion.div>

          {/* Memory */}
          <motion.div className={cardBase} {...reveal} transition={{ duration: 0.6, delay: 0.1 }} whileHover={{ y: -4 }}>
            <IconBadge icon={Boxes} />
            <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-frost">Memory you can see</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Variables render as boxes, with shared references drawn between them — aliasing bugs stop hiding.
            </p>
            <MemoryMotif />
          </motion.div>

          {/* Complexity */}
          <motion.div className={cardBase} {...reveal} transition={{ duration: 0.6, delay: 0.2 }} whileHover={{ y: -4 }}>
            <IconBadge icon={Gauge} />
            <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-frost">Complexity, measured</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Big O from real loop nesting and recursion shape — never guessed.
            </p>
            <div className="mt-4 font-mono text-2xl font-semibold">
              <GradientText>O(n log n)</GradientText>
            </div>
          </motion.div>

          {/* Visualizers (wide) */}
          <motion.div
            className={`${cardBase} md:col-span-2`}
            {...reveal}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ y: -4 }}
          >
            <IconBadge icon={Network} />
            <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-frost">A dozen visualizers, auto chosen</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-mist">
              RunX reads your code and its trace, then opens the view that fits — no configuration.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Array", "Stack", "Queue", "Linked list", "Tree", "Graph", "Recursion", "Sorting"].map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-[rgba(186,215,247,0.1)] bg-[rgba(199,211,234,0.04)] px-2 py-1 font-mono text-[11px] text-mist transition-colors group-hover:border-[rgba(155,140,247,0.25)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* In-browser */}
          <motion.div className={cardBase} {...reveal} transition={{ duration: 0.6, delay: 0.25 }} whileHover={{ y: -4 }}>
            <IconBadge icon={Globe} />
            <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-frost">Runs in your browser</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Python via Pyodide, JavaScript in a worker. Nothing to install, nothing leaves your machine.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function IconBadge({ icon: Icon }: { icon: typeof StepForward }) {
  return (
    <div className="flex size-11 items-center justify-center rounded-xl border border-[rgba(155,140,247,0.25)] bg-[rgba(102,58,243,0.12)] text-[#b8a9fb] transition-transform duration-300 group-hover:scale-110">
      <Icon className="size-5" strokeWidth={1.5} />
    </div>
  );
}

/** Three code lines with a periwinkle "current line" bar that walks down them. */
function StepMotif() {
  return (
    <div className="mt-8 space-y-2 font-mono text-[11px]">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="relative flex items-center gap-2">
          <motion.span
            className="absolute -left-2 h-4 w-0.5 rounded bg-[#9b8cf7]"
            animate={{ opacity: [0, 0, 1, 0, 0] }}
            transition={{ duration: 4, times: [0, row / 4, (row + 0.5) / 4, (row + 1) / 4, 1], repeat: Infinity }}
          />
          <span className="w-3 text-fog/60">{row + 1}</span>
          <span className="h-2 rounded bg-[rgba(199,211,234,0.1)]" style={{ width: `${55 + ((row * 37) % 40)}%` }} />
        </div>
      ))}
    </div>
  );
}

/** Two boxes joined by a reference arrow that pulses. */
function MemoryMotif() {
  return (
    <div className="mt-6 flex items-center gap-2">
      <span className="flex size-9 items-center justify-center rounded-md border border-[rgba(186,215,247,0.14)] bg-[rgba(199,211,234,0.05)] font-mono text-[11px] text-mist">
        a
      </span>
      <motion.span
        className="h-px flex-1 origin-left bg-linear-to-r from-[rgba(155,140,247,0.6)] to-[rgba(155,140,247,0.1)]"
        animate={{ scaleX: [0.6, 1, 0.6], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="flex size-9 items-center justify-center rounded-md border border-[rgba(155,140,247,0.3)] bg-[rgba(102,58,243,0.12)] font-mono text-[11px] text-[#cdbffb]">
        [ ]
      </span>
    </div>
  );
}
