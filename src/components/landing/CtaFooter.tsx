"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { GradientText } from "./kit";

/** Closing conversion band with a glowing panel, then a quiet footer. */
export function CtaFooter() {
  return (
    <>
      <section className="relative overflow-hidden border-t border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#070b14] px-8 py-16 text-center sm:px-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-2/3 rounded-full bg-cyan-500/20 blur-[100px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.4)_1px,transparent_0)] bg-size-[22px_22px] mask-[radial-gradient(ellipse_60%_60%_at_50%_0%,#000,transparent)]"
            />

            <div className="relative">
              <h2 className="text-balance text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-6xl">
                Stop guessing. <GradientText className="font-semibold">Start seeing</GradientText>.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-base font-light text-white/55 sm:text-lg">
                Open the workspace, paste your code, and watch it run — no sign-up.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/app"
                  className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-500 to-sky-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-400 hover:to-sky-500"
                >
                  Launch RunX
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/app"
                  className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/10"
                >
                  Start from an example
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-black">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <span className="font-display text-base font-semibold tracking-tight text-white">
            Run<span className="text-cyan-400">X</span>
          </span>
          <span className="text-center font-mono text-[12px] text-white/40">
            Built for students. Runs Python &amp; JavaScript in your browser.
          </span>
        </div>
      </footer>
    </>
  );
}
