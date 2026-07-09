import Link from "next/link";

import { LaunchButton } from "./LaunchButton";

/** Frosted, translucent landing nav that floats over the midnight canvas. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(186,215,247,0.08)] bg-[rgba(5,6,15,0.55)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
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

        <LaunchButton variant="ghost" size="sm" label="Launch" withArrow={false} className="ml-auto sm:ml-0" />
      </div>
    </header>
  );
}
