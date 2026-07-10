import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared building blocks for the landing page, matching the shader hero:
 * pure-black stage, frosted glass surfaces, a cyan→orange accent, and thin
 * high-contrast type. Kept here so every section reads as one system.
 */

/** Glassy capsule label with a cyan hairline along its top edge (hero badge). */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm",
        className
      )}
    >
      <div className="absolute left-3 right-3 top-0 h-px rounded-full bg-linear-to-r from-transparent via-cyan-400/40 to-transparent" />
      <span className="relative z-10 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
        {children}
      </span>
    </div>
  );
}

/** Cyan→white→sky gradient text, the hero's headline treatment. */
export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("bg-linear-to-r from-cyan-300 via-white to-sky-400 bg-clip-text text-transparent", className)}
    >
      {children}
    </span>
  );
}

/** Frosted card that warms to a cyan edge on hover. The base landing surface. */
export function GlowCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/5",
        className
      )}
    >
      {/* Cyan hairline that lights up the top edge on hover. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-4 right-4 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {children}
    </div>
  );
}

/** Soft cyan + sky glows that tie a section back to the shader hero. */
export function SectionGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-sky-500/10 blur-[120px]" />
    </div>
  );
}
