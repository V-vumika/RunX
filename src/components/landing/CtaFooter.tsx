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
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="max-w-xs lg:col-span-2">
              <span className="font-display text-lg font-medium tracking-tight text-frost">
                Run<span className="text-[#b8a9fb]">X</span>
              </span>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                See how your code actually runs. Built for students — Python &amp; JavaScript in your browser,
                Java &amp; C++ on the way.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                ["Workspace", "/app"],
                ["Visualizers", "#showcase"],
                ["Complexity", "#features"],
              ]}
            />
            <FooterCol
              title="Resources"
              links={[
                ["GitHub", "https://github.com/V-vumika/RunX"],
                ["How it works", "#features"],
                ["Questions", "#faq"],
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[rgba(186,215,247,0.06)] pt-6 sm:flex-row">
            <span className="font-mono text-[11px] text-fog">
              © {new Date().getFullYear()} RunX. Built for students.
            </span>
            <div className="flex items-center gap-5 font-mono text-[11px] text-fog">
              <Link href="#" className="transition-colors hover:text-frost">
                Privacy
              </Link>
              <Link href="#" className="transition-colors hover:text-frost">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/70">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => {
          const external = href.startsWith("http");
          return (
            <li key={label}>
              {external ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-mist transition-colors hover:text-frost"
                >
                  {label}
                </a>
              ) : (
                <Link href={href} className="text-sm text-mist transition-colors hover:text-frost">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
