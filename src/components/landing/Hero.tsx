"use client";

import React, { useRef } from "react";
import { useScroll, useTransform } from "framer-motion";

import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { ParticleField } from "./authkit/ParticleField";

/**
 * Hero built around the scroll-driven "flowing lines" effect: five RunX-coloured
 * traces draw themselves as you scroll the tall section, evoking a program's
 * execution streaming through, over the lit navy canvas and rising particles.
 * The wordmark, copy and Launch action stay RunX.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const p1 = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
  const p2 = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
  const p3 = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);
  const p4 = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]);
  const p5 = useTransform(scrollYProgress, [0, 0.8], [0, 1.2]);

  return (
    <section ref={ref} className="relative h-[250vh] w-full overflow-clip">
      <ParticleField />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[80vh] ak-ambient" />

      <GoogleGeminiEffect
        pathLengths={[p1, p2, p3, p4, p5]}
        title="RunX"
        description="Watch every line, every variable, every step draw itself, live in your browser, instead of hidden behind a single answer."
      />
    </section>
  );
}
