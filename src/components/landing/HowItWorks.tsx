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
    <section className="relative border-t border-[rgba(186,215,247,0.07)]">
      <SectionGlow />
      <div className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <motion.div
          className="grid gap-6 lg:grid-cols-2 lg:items-end"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <Pill>How it works</Pill>
            <h2 className="mt-6 font-display text-4xl font-medium leading-[1.1] tracking-tight text-frost sm:text-5xl">
              From code to <GradientText className="font-medium">clarity</GradientText> in three steps
            </h2>
          </div>
          <p className="text-base leading-relaxed text-mist lg:pb-2 lg:text-right">
            No setup, no accounts, no annotations. Paste a snippet, press run, and RunX turns it into a
            step-by-step picture of exactly how it executes.
          </p>
        </motion.div>

        <div className="relative mt-16">
          {/* Animated connecting line (desktop). */}
          <motion.div
            aria-hidden
            className="absolute left-0 right-0 top-8 hidden h-px origin-left bg-linear-to-r from-[rgba(155,140,247,0)] via-[rgba(155,140,247,0.4)] to-[rgba(155,140,247,0)] lg:block"
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
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[rgba(155,140,247,0.25)] bg-[#0b1020] text-[#b8a9fb] shadow-lg shadow-[rgba(102,58,243,0.12)] lg:mx-0">
                  <Icon className="size-7" strokeWidth={1.5} />
                </div>
                <div className="mt-5 flex items-center justify-center gap-2 lg:justify-start">
                  <span className="font-mono text-xs text-[#9b8cf7]/80">{step}</span>
                  <h3 className="font-display text-lg font-medium tracking-tight text-frost">{title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
