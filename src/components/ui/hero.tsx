"use client";

import { useEffect, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { CodeStepper } from "@/components/landing/CodeStepper";

/**
 * RunX hero: a split stage over an animated cyan mesh-gradient (Paper Shaders).
 * Left column carries the pitch and CTAs; the right shows a faithful mockup of
 * the actual workspace so the product is visible above the fold. The shaders are
 * gated behind `mounted` (client-only WebGL) and swapped for a static CSS
 * gradient when the visitor prefers reduced motion. A dark scrim keeps the copy
 * legible over the moving gradient.
 */
export default function RunXHero() {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const showShaders = mounted && !reduce;

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      <svg className="absolute inset-0 h-0 w-0">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
          </filter>
          <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Animated shader stage (client-only) or static fallback. */}
      {showShaders ? (
        <>
          <MeshGradient
            className="absolute inset-0 h-full w-full"
            colors={["#000000", "#06b6d4", "#0891b2", "#0e2a3a", "#38bdf8"]}
            speed={0.3}
          />
          <MeshGradient
            className="absolute inset-0 h-full w-full opacity-50"
            colors={["#000000", "#0ea5e9", "#22d3ee", "#0369a1"]}
            speed={0.2}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_22%,rgba(6,182,212,0.28),transparent_55%),radial-gradient(ellipse_at_82%_65%,rgba(14,165,233,0.20),transparent_52%)]" />
      )}

      {/* Legibility scrim: darken the left where the copy sits, and the base. */}
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-black/85 via-black/45 to-black/20" />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/40" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pb-16 pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left: pitch */}
          <div className="max-w-xl">
            <motion.div
              className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm"
              style={{ filter: "url(#glass-effect)" }}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="absolute left-3 right-3 top-0 h-px rounded-full bg-linear-to-r from-transparent via-cyan-400/40 to-transparent" />
              <span className="size-1.5 animate-pulse rounded-full bg-cyan-400" />
              <span className="relative z-10 text-[13px] font-medium tracking-wide text-white/90">
                Now running Python &amp; JavaScript
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{ filter: "url(#text-glow)" }}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              See how your code{" "}
              <span className="bg-linear-to-r from-cyan-300 via-white to-sky-400 bg-clip-text font-semibold text-transparent">
                actually runs
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-lg text-base font-light leading-relaxed text-white/60 sm:text-lg"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              RunX steps through your code line by line — variables, memory, the call stack, data structures and
              complexity, drawn as it happens instead of hidden behind a single answer.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap items-center gap-3"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link
                href="/app"
                className="rounded-full bg-linear-to-r from-cyan-500 to-sky-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:from-cyan-400 hover:to-sky-500 hover:shadow-cyan-500/30"
              >
                Launch RunX
              </Link>
              <Link
                href="/app"
                className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/10"
              >
                See an example
              </Link>
            </motion.div>

            <motion.p
              className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white/35"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              No sign-up · Runs in your browser · Free
            </motion.p>
          </div>

          {/* Right: product mockup */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <CodeStepper />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
