"use client";

import { motion } from "framer-motion";
import { ClipboardPaste, Play, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Pill, GradientText, SectionGlow } from "./kit";

const STEPS: { icon: LucideIcon; step: string; title: string; body: string }[] = [
  {
    icon: ClipboardPaste,
    step: "01",
    title: "Paste your code",
    body: "Drop in any Python or JavaScript — a function, a LeetCode class, a whole script. No setup, no annotations.",
  },
  {
    icon: Play,
    step: "02",
    title: "Press run",
    body: "RunX executes it safely in your browser and records every step: each line, every variable, the call stack.",
  },
  {
    icon: Eye,
    step: "03",
    title: "See how it runs",
    body: "Step through the trace while the right visualizer animates your data — and read the complexity it measured.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative border-t border-white/5 bg-black">
      <SectionGlow />
      <div className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center">
            <Pill>How it works</Pill>
          </div>
          <h2 className="mt-6 text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-5xl">
            From code to <GradientText className="font-semibold">clarity</GradientText> in three steps
          </h2>
        </motion.div>

        <div className="relative mt-16">
          {/* Animated connecting line (desktop). */}
          <motion.div
            aria-hidden
            className="absolute left-0 right-0 top-8 hidden h-px origin-left bg-linear-to-r from-cyan-400/0 via-cyan-400/40 to-cyan-400/0 lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {STEPS.map(({ icon: Icon, step, title, body }, idx) => (
              <motion.div
                key={step}
                className="relative text-center lg:text-left"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-[#070b14] text-cyan-300 shadow-lg shadow-cyan-500/10 lg:mx-0">
                  <Icon className="size-7" strokeWidth={1.5} />
                </div>
                <div className="mt-5 flex items-center justify-center gap-2 lg:justify-start">
                  <span className="font-mono text-xs text-cyan-400/70">{step}</span>
                  <h3 className="text-lg font-medium tracking-tight text-white">{title}</h3>
                </div>
                <p className="mt-2 text-sm font-light leading-relaxed text-white/55">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
