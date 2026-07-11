"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Persistent top nav in AuthKit's layout: a muted wordmark on the left, the
 * product logo mark centered, and a GitHub button + CTA pill on the right.
 * Transparent over the lit hero, then a frosted navy bar once the page scrolls.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-[rgba(186,215,247,0.1)] bg-[rgba(8,11,23,0.72)] backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="relative mx-auto flex max-w-6xl items-center px-6 py-4">
        {/* Left: muted wordmark. */}
        <Link
          href="/"
          className="font-display text-lg font-medium tracking-tight text-mist transition-colors hover:text-frost"
        >
          Run<span className="text-[#b8a9fb]">X</span>
        </Link>

        {/* Center: product logo mark. */}
        <Link
          href="/"
          aria-label="RunX"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-90 transition-opacity hover:opacity-100"
        >
          <LogoMark />
        </Link>

        {/* Right: section links + GitHub + CTA. */}
        <div className="ml-auto flex items-center gap-2.5">
          <nav className="mr-1 hidden items-center gap-1 md:flex">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#showcase">Visualizers</NavLink>
            <NavLink href="/app">Examples</NavLink>
          </nav>
          <a
            href="https://github.com/V-vumika/RunX"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="grid size-9 place-items-center rounded-full border border-[rgba(186,215,247,0.16)] bg-[rgba(199,211,234,0.05)] text-fog transition-colors hover:text-frost"
          >
            <GithubIcon />
          </a>
          <Link
            href="/app"
            className="flex h-9 items-center rounded-full border border-[rgba(186,215,247,0.16)] bg-[rgba(199,211,234,0.06)] px-5 text-xs font-medium text-frost transition-colors hover:border-[rgba(155,140,247,0.4)] hover:bg-[rgba(199,211,234,0.1)]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-mist transition-colors hover:bg-[rgba(186,214,247,0.08)] hover:text-frost"
    >
      {children}
    </Link>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58l-.01-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.22.7.83.58C20.56 22.29 24 17.8 24 12.5 24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

/** RunX mark: a periwinkle→violet hexagon framing an inner diamond. */
function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <defs>
        <linearGradient id="runx-mark" x1="4" y1="2.5" x2="24" y2="25.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#cdbffb" />
          <stop offset="1" stopColor="#663af3" />
        </linearGradient>
      </defs>
      <path
        d="M14 2.5 21.5 8.25 V19.75 L14 25.5 6.5 19.75 V8.25 Z"
        fill="url(#runx-mark)"
        fillOpacity="0.16"
        stroke="url(#runx-mark)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M14 9 18 14 14 19 10 14 Z" fill="url(#runx-mark)" />
    </svg>
  );
}
