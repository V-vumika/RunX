"use client";

import { Fragment, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { StepForward, Boxes, Layers, Network, Gauge, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TILES: { icon: LucideIcon; label: string }[] = [
  { icon: StepForward, label: "Step" },
  { icon: Boxes, label: "Memory" },
  { icon: Layers, label: "Call stack" },
  { icon: Network, label: "Structures" },
  { icon: Gauge, label: "Complexity" },
  { icon: Share2, label: "Share" },
];

/**
 * The pipeline of what RunX surfaces, as an animated timeline: a violet
 * "execution pulse" travels node to node (the way a trace flows through a
 * program), each node lighting up and its outgoing connector filling as the
 * pulse passes. Nodes stagger in on scroll and respond to hover. Honours
 * prefers-reduced-motion by holding still.
 */
export function FeatureTimeline() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % TILES.length), 1500);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <motion.div
      className="flex items-start justify-center gap-1.5 sm:gap-2"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
    >
      {TILES.map(({ icon: Icon, label }, i) => {
        const isActive = active === i;
        return (
          <Fragment key={label}>
            <motion.div
              className="flex flex-col items-center gap-3"
              variants={{
                hidden: { opacity: 0, y: 18, scale: 0.85 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <motion.button
                type="button"
                aria-label={label}
                onMouseEnter={() => setActive(i)}
                animate={{ scale: isActive ? 1.12 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="ak-glass ak-hairline relative flex size-14 items-center justify-center rounded-full sm:size-16"
              >
                {/* Violet bloom when the pulse is on this node. */}
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{ boxShadow: "0 0 24px 2px rgba(102,58,243,0.55)" }}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                />
                {/* One expanding ring ping while active. */}
                {isActive && !reduce && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-[rgba(155,140,247,0.7)]"
                    initial={{ opacity: 0.7, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.55 }}
                    transition={{ duration: 1.5, ease: "easeOut", repeat: Infinity }}
                  />
                )}
                <Icon
                  className={`relative size-5 transition-colors duration-300 sm:size-6 ${
                    isActive ? "text-white" : "text-frost"
                  }`}
                  strokeWidth={1.5}
                />
              </motion.button>
              <span
                className={`font-mono text-[10px] transition-colors duration-300 sm:text-[11px] ${
                  isActive ? "text-frost" : "text-mist"
                }`}
              >
                {label}
              </span>
            </motion.div>

            {i < TILES.length - 1 && (
              <div className="relative mt-7 hidden h-px w-7 shrink-0 overflow-hidden sm:mt-8 sm:w-14">
                {/* Ambient marching dashes, then the pulse fill leaving this node. */}
                <span className="ak-connector absolute inset-0" />
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-left"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(155,140,247,0.9), transparent)",
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={active === i ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </motion.div>
  );
}
