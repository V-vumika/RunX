"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

import { Pill, SectionGlow } from "./kit";

const ITEMS: { q: string; a: string }[] = [
  {
    q: "Is my code sent to a server?",
    a: "No. Python runs in your browser through Pyodide and JavaScript runs in a sandboxed Web Worker. Your code never leaves your machine.",
  },
  {
    q: "Do I need to annotate or configure anything?",
    a: "Nothing. Paste a function, a script, or a bare LeetCode class — RunX detects an entry point, runs it, and picks the visualizer that fits the trace.",
  },
  {
    q: "How is the complexity worked out?",
    a: "The Big-O class comes from static analysis of loop nesting and recursion shape — never guessed by an AI. Only the plain-English explanation is generated.",
  },
  {
    q: "Which languages are supported?",
    a: "Python and JavaScript run today. Java and C++ are on the way, built on the same visual engine, so the views stay identical across languages.",
  },
  {
    q: "Is it free?",
    a: "Yes. RunX is built for students — no sign-up required to run code and step through it in your browser.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="relative border-t border-white/5 bg-black">
      <SectionGlow />
      <div className="mx-auto max-w-3xl px-6 py-28 sm:py-32">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center">
            <Pill>Questions</Pill>
          </div>
          <h2 className="mt-6 text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-5xl">
            Good to know
          </h2>
        </motion.div>

        <div className="mt-12 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/3"
                  aria-expanded={isOpen}
                >
                  <span className={`text-[15px] font-medium transition-colors ${isOpen ? "text-cyan-200" : "text-white"}`}>
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                      isOpen ? "border-cyan-400/40 text-cyan-300" : "border-white/15 text-white/50"
                    }`}
                  >
                    <Plus className="size-3.5" strokeWidth={2} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm font-light leading-relaxed text-white/55">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
