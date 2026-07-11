"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { GradientText } from "./kit";

/** Closing conversion band with a glowing panel, then a quiet footer. */
export function CtaFooter() {
  return (
    <>
      <section className="relative overflow-hidden border-t border-[rgba(186,215,247,0.07)]">
        <div className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-[rgba(155,140,247,0.22)] bg-[#0a0e1c] px-8 py-16 text-center sm:px-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-2/3 rounded-full bg-[rgba(102,58,243,0.22)] blur-[100px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_1px_1px,rgba(186,215,247,0.4)_1px,transparent_0)] bg-size-[22px_22px] mask-[radial-gradient(ellipse_60%_60%_at_50%_0%,#000,transparent)]"
            />

            <div className="relative">
              <h2 className="text-balance font-display text-4xl font-medium leading-[1.05] tracking-tight text-frost sm:text-6xl">
                Stop guessing. <GradientText className="font-medium">Start seeing</GradientText>.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-base text-mist sm:text-lg">
                Open the workspace, paste your code, and watch it run — no sign-up.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/app"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#dfe8f4] px-8 py-4 text-sm font-medium text-[#10131f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_28px_rgba(3,4,10,0.5)] transition-colors hover:bg-white"
                >
                  Launch RunX
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/app"
                  className="rounded-full border border-[rgba(186,215,247,0.18)] bg-[rgba(186,214,247,0.05)] px-8 py-4 text-sm font-medium text-frost backdrop-blur-sm transition-colors hover:border-[rgba(155,140,247,0.4)] hover:bg-[rgba(186,214,247,0.1)]"
                >
                  Start from an example
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-[rgba(186,215,247,0.07)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <span className="font-display text-base font-medium tracking-tight text-frost">
            Run<span className="text-[#b8a9fb]">X</span>
          </span>
          <span className="text-center font-mono text-[12px] text-fog">
            Built for students. Runs Python &amp; JavaScript in your browser.
          </span>
        </div>
      </footer>
    </>
  );
}
