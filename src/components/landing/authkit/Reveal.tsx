"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Scroll-in reveal: fades and lifts its children into place the first time they
 * enter the viewport. A shared building block so every section animates the same
 * way. Collapses to a plain wrapper when the viewer prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
