import Link from "next/link";
import { ScanSearch } from "lucide-react";

import { LaunchButton } from "./LaunchButton";

/** Sticky landing nav — brand on the left, one clear way into the app on the right. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ScanSearch className="size-5" />
          </span>
          <span className="font-semibold tracking-tight">RunX</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
          <a href="#showcase" className="transition-colors hover:text-foreground">
            Visualizers
          </a>
        </nav>

        <div className="ml-auto sm:ml-7">
          <LaunchButton size="sm" label="Launch" />
        </div>
      </div>
    </header>
  );
}
