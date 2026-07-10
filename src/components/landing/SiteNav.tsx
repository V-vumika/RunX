"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Persistent top nav: transparent while it sits over the shader hero, then fades
 * in a frosted-glass background once the page scrolls, so Launch and the section
 * links are always reachable (not just at the very top).
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
        scrolled ? "border-b border-white/10 bg-black/70 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-white">
          Run<span className="text-cyan-400">X</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#showcase">Visualizers</NavLink>
          <NavLink href="/app">Examples</NavLink>
        </nav>

        <Link
          href="/app"
          className="ml-auto flex h-9 items-center rounded-full bg-white px-5 text-xs font-medium text-black transition-colors hover:bg-white/90 sm:ml-0"
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
      className="rounded-full px-3 py-2 text-xs font-light text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  );
}
