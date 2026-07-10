import Link from "next/link";

import { LaunchButton } from "./LaunchButton";

/**
 * Landing nav rendered as part of the hero: transparent, borderless, sitting
 * directly on the midnight canvas so the hero's blueprint grid runs up behind
 * it (like the AuthKit reference). Absolutely positioned so the hero starts at
 * the very top of the page.
 */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-5">
        <Link href="/" className="font-display text-lg font-medium tracking-tight text-frost">
          RunX
        </Link>

        <nav className="ml-auto hidden items-center gap-7 sm:flex">
          <a
            href="#showcase"
            className="font-mono text-[12px] uppercase tracking-[0.15em] text-mist transition-colors hover:text-frost"
          >
            Visualizers
          </a>
        </nav>

        <LaunchButton size="sm" label="Launch" withArrow={false} className="ml-auto sm:ml-0" />
      </div>
    </header>
  );
}
