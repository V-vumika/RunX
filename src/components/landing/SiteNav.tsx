"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Persistent top nav in the AuthKit language: transparent while it sits over the
 * lit hero, then a frosted navy bar with a hairline once the page scrolls, so
 * Launch and the section links are always reachable.
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
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="font-display text-xl font-medium tracking-tight text-frost">
          Run<span className="text-[#b8a9fb]">X</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#showcase">Visualizers</NavLink>
          <NavLink href="/app">Examples</NavLink>
        </nav>

        <Link
          href="/app"
          className="ml-auto flex h-9 items-center rounded-full bg-[#dfe8f4] px-5 text-xs font-medium text-[#10131f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_28px_rgba(3,4,10,0.45)] transition-colors hover:bg-white sm:ml-0"
        >
          Launch
        </Link>
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
