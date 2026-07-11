/**
 * The hero's bespoke backdrop, reverse-engineered from the AuthKit reference:
 * a faint blueprint cell grid that fades at the edges, a set of brighter framing
 * lines that hug the wordmark, two `x` registration marks on the inner verticals
 * at the eyebrow's shoulders, small dots where the frame meets the horizontals,
 * a wide diffused light beam, a soft halo, and a vignette. Purely decorative.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Faint tiled blueprint grid, masked to fade out toward the edges. */}
      <div className="absolute inset-0 ak-grid" />

      {/* Brighter framing lines: inner verticals hug the heading, outers and
          horizontals frame the composition. Each fades out at its ends. */}
      <VLine left="27%" strong />
      <VLine left="73%" strong />
      <VLine left="9%" />
      <VLine left="91%" />
      <HLine top="15%" />
      <HLine top="54%" />

      {/* Registration marks: two crosses at the eyebrow shoulders, small dots
          where the inner verticals cross the framing horizontals. */}
      <Cross left="27%" top="22%" />
      <Cross left="73%" top="22%" />
      <Dot left="27%" top="15%" />
      <Dot left="73%" top="15%" />
      <Dot left="27%" top="54%" />
      <Dot left="73%" top="54%" />
      <Dot left="9%" top="15%" />
      <Dot left="91%" top="15%" />

      {/* Bright source at the apex, then a wide diffused cone falling from it,
          then a soft halo bloom behind the wordmark. */}
      <div className="absolute left-1/2 top-[-3%] size-32 -translate-x-1/2 ak-beam-source" />
      <div className="absolute left-1/2 top-[-2%] h-[74vh] w-[42rem] -translate-x-1/2 ak-beam" />
      <div className="absolute inset-x-0 top-0 h-[60vh] ak-halo" />

      {/* Corners recede so the lit center is the focus. */}
      <div className="absolute inset-0 ak-vignette" />
    </div>
  );
}

function VLine({ left, strong = false }: { left: string; strong?: boolean }) {
  return (
    <span
      className="absolute inset-y-0 w-px"
      style={{
        left,
        background: `linear-gradient(to bottom, transparent, rgba(186,215,247,${
          strong ? 0.12 : 0.05
        }) 30%, rgba(186,215,247,${strong ? 0.12 : 0.05}) 60%, transparent)`,
      }}
    />
  );
}

function HLine({ top }: { top: string }) {
  return (
    <span
      className="absolute inset-x-0 h-px"
      style={{
        top,
        background:
          "linear-gradient(to right, transparent, rgba(186,215,247,0.08) 30%, rgba(186,215,247,0.08) 70%, transparent)",
      }}
    />
  );
}

/** A faint blueprint "x" mark, centered on the given intersection. */
function Cross({ left, top }: { left: string; top: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="absolute size-5 -translate-x-1/2 -translate-y-1/2 text-[rgba(186,215,247,0.3)]"
      style={{ left, top }}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
    >
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

/** A tiny registration dot at a frame intersection. */
function Dot({ left, top }: { left: string; top: string }) {
  return (
    <span
      className="absolute size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(186,215,247,0.3)]"
      style={{ left, top }}
    />
  );
}
