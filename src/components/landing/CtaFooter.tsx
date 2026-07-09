import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";

import { GridBackdrop } from "./authkit/GridBackdrop";
import { Eyebrow } from "./authkit/Eyebrow";

/** Closing "get started" band with two glass cards, then a quiet footer. */
export function CtaFooter() {
  return (
    <>
      <section className="relative overflow-hidden">
        <GridBackdrop />
        <div className="relative mx-auto max-w-4xl px-6 py-28">
          <div className="text-center">
            <Eyebrow>Get started</Eyebrow>
            <h2 className="ak-skywash mt-6 text-balance font-display text-[2.25rem] font-medium leading-[1.05] tracking-tight sm:text-[3rem]">
              Start visualizing today
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <CtaCard href="/app" title="Launch RunX" sub="Open the workspace and paste your code." primary />
            <CtaCard href="/app" title="Start from an example" sub="Six algorithms, ready to run in one click." />
          </div>
        </div>
      </section>

      <footer className="border-t border-[rgba(186,215,247,0.08)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <span className="font-display text-base font-medium text-frost">RunX</span>
          <span className="text-center font-mono text-[12px] text-fog">
            Built for students. Runs Python in your browser with Pyodide.
          </span>
        </div>
      </footer>
    </>
  );
}

function CtaCard({
  href,
  title,
  sub,
  primary = false,
}: {
  href: string;
  title: string;
  sub: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group ak-glass ak-hairline relative overflow-hidden rounded-2xl p-8 transition-colors hover:bg-[rgba(186,214,247,0.05)]"
    >
      <div className="flex h-24 items-center justify-center">
        {primary ? (
          <span className="ak-glass-deep ak-hairline flex items-center rounded-xl px-6 py-3">
            <span className="ak-skywash font-display text-2xl font-medium">RunX</span>
          </span>
        ) : (
          <LayoutGrid className="size-9 text-[#b8a9fb]" strokeWidth={1.2} />
        )}
      </div>
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-1.5 font-display text-lg font-medium text-frost">
          {title}
          <ArrowRight className="size-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </div>
        <p className="mt-1 text-sm text-mist">{sub}</p>
      </div>
    </Link>
  );
}
