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
    <section className="relative border-t border-[rgba(186,215,247,0.07)]">
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
          <h2 className="mt-6 font-display text-4xl font-medium leading-[1.1] tracking-tight text-frost sm:text-5xl">
            Python and JavaScript today. <GradientText className="font-medium">More next</GradientText>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
            Every language is just another tracer feeding the same visual engine, so the views you learn never change.
          </p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {LANGS.map(({ name, status, glyph }, i) => (
            <motion.div
              key={name}
              className={`group relative overflow-hidden rounded-2xl border p-6 text-center backdrop-blur-sm transition-colors ${
                status === "live"
                  ? "border-[rgba(127,215,192,0.28)] bg-[rgba(127,215,192,0.06)] hover:border-[rgba(127,215,192,0.45)]"
                  : "border-[rgba(186,215,247,0.1)] bg-[rgba(186,214,247,0.03)]"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <div
                className={`mx-auto flex size-12 items-center justify-center rounded-xl font-mono text-sm font-semibold ${
                  status === "live" ? "bg-[rgba(127,215,192,0.14)] text-[#7fd7c0]" : "bg-[rgba(199,211,234,0.05)] text-fog"
                }`}
              >
                {glyph}
              </div>
              <p className="mt-3 text-sm font-medium text-frost">{name}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
                  status === "live" ? "text-[#7fd7c0]" : "text-fog/70"
                }`}
              >
                {status === "live" && <span className="size-1.5 animate-pulse rounded-full bg-[#7fd7c0]" />}
                {status === "live" ? "Live" : "Coming soon"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
