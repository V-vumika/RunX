import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared building blocks in the AuthKit language: frosted glass on the midnight
 * navy stage, frost hairlines, a skywash gradient for headings, and a restrained
 * periwinkle accent. Kept here so every section reads as one system.
 */

/** Glassy capsule label with a frost hairline along its top edge. */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full border border-hairline bg-[rgba(186,214,247,0.04)] px-4 py-1.5 backdrop-blur-sm",
        className
      )}
    >
      <div className="absolute left-3 right-3 top-0 h-px rounded-full bg-linear-to-r from-transparent via-[rgba(186,215,247,0.45)] to-transparent" />
      <span className="relative z-10 font-mono text-[11px] uppercase tracking-[0.2em] text-fog">{children}</span>
    </div>
  );
}

/** Skywash (frost→blue) gradient text, the hero's headline treatment. */
export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("ak-skywash", className)}>{children}</span>;
}

/** Frosted card that warms to a periwinkle edge on hover. The base landing surface. */
export function GlowCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[rgba(186,215,247,0.1)] bg-[rgba(186,214,247,0.03)] backdrop-blur-sm transition-all duration-300 hover:border-[rgba(155,140,247,0.35)] hover:bg-[rgba(186,214,247,0.05)]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-4 right-4 top-0 h-px bg-linear-to-r from-transparent via-[rgba(155,140,247,0.5)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {children}
    </div>
  );
}

/** Soft violet + frost glows that tie a section back to the hero's lit stage. */
export function SectionGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[rgba(102,58,243,0.1)] blur-[120px]" />
      <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[rgba(120,150,235,0.08)] blur-[120px]" />
    </div>
  );
}
