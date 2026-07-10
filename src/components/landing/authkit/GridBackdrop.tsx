import { cn } from "@/lib/utils";

/**
 * Ambient page atmosphere for quieter sections (e.g. the closing CTA): a faint
 * blueprint grid on the midnight canvas, faded at the edges. The hero uses its
 * own bespoke backdrop (see HeroBackdrop) to match the reference composition.
 */
export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 ak-grid" />
    </div>
  );
}
