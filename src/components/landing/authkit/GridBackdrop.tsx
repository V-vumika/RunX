import { cn } from "@/lib/utils";

/**
 * Ambient page atmosphere for the AuthKit look: a faint blueprint grid on the
 * midnight canvas, optionally lit by a spotlight beam and a soft halo at the top
 * (used behind the hero wordmark).
 */
export function GridBackdrop({
  spotlight = false,
  className,
}: {
  spotlight?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 ak-grid" />
      {spotlight && (
        <>
          <div className="absolute inset-x-0 top-0 h-[75vh] ak-spotlight opacity-80" />
          <div className="absolute inset-x-0 top-0 h-[60vh] ak-halo" />
        </>
      )}
    </div>
  );
}
