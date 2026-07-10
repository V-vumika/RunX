"use client";

import { motion } from "framer-motion";

import { Pill, GradientText, SectionGlow } from "./kit";

const LANGS: { name: string; status: "live" | "soon"; glyph: string }[] = [
  { name: "Python", status: "live", glyph: "py" },
  { name: "JavaScript", status: "live", glyph: "js" },
  { name: "Java", status: "soon", glyph: "jv" },
  { name: "C++", status: "soon", glyph: "c++" },
];

export function Languages() {
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
            <Pill>One engine, many languages</Pill>
          </div>
          <h2 className="mt-6 text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-5xl">
            Python and JavaScript today. <GradientText className="font-semibold">More next</GradientText>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-white/50 sm:text-lg">
            Every language is just another tracer feeding the same visual engine, so the views you learn never change.
          </p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {LANGS.map(({ name, status, glyph }, i) => (
            <motion.div
              key={name}
              className={`group relative overflow-hidden rounded-2xl border p-6 text-center backdrop-blur-sm transition-colors ${
                status === "live"
                  ? "border-cyan-400/25 bg-cyan-500/5 hover:border-cyan-400/40"
                  : "border-white/10 bg-white/3"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <div
                className={`mx-auto flex size-12 items-center justify-center rounded-xl font-mono text-sm font-semibold ${
                  status === "live" ? "bg-cyan-500/15 text-cyan-300" : "bg-white/5 text-white/40"
                }`}
              >
                {glyph}
              </div>
              <p className="mt-3 text-sm font-medium text-white">{name}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
                  status === "live" ? "text-cyan-300" : "text-white/35"
                }`}
              >
                {status === "live" && <span className="size-1.5 animate-pulse rounded-full bg-cyan-400" />}
                {status === "live" ? "Live" : "Coming soon"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
