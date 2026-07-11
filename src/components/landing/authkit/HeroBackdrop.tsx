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
      {/* The blueprint frame is pixel-tuned to the capped desktop wordmark, so
          it only shows at lg and up — below that the type scales with the
          viewport and the lines would drift off the glyphs. */}
      <div className="hidden lg:block">
        {/* Four framing verticals: the two symmetric pairs that hug the wordmark
            (±245px inner / ±305px from center). The inner pair is brighter. */}
        <VLine left="calc(50% - 245px)" strong />
        <VLine left="calc(50% + 245px)" strong />
        <VLine left="calc(50% - 305px)" />
        <VLine left="calc(50% + 305px)" />

        {/* Horizontals: 100/148/196 are the three lines above the wordmark;
            196/372 top and bottom the wordmark rectangle; 454 brackets the
            subcopy. The eyebrow sits in the 148→196 band with its own broken
            rule (rendered with the text in Hero). */}
        <HLine top="100px" />
        <HLine top="148px" />
        <HLine top="196px" />
        <HLine top="372px" />
        <HLine top="454px" />

        {/* Crosses centered in the eyebrow-band side squares (between 148 and 196). */}
        <Cross left="calc(50% - 275px)" top="172px" />
        <Cross left="calc(50% + 275px)" top="172px" />

        {/* Registration dots on the inner verticals at the three lower horizontals. */}
        <Dot left="calc(50% - 245px)" top="196px" />
        <Dot left="calc(50% + 245px)" top="196px" />
        <Dot left="calc(50% - 245px)" top="372px" />
        <Dot left="calc(50% + 245px)" top="372px" />
        <Dot left="calc(50% - 245px)" top="454px" />
        <Dot left="calc(50% + 245px)" top="454px" />
      </div>

      {/* Bright source at the apex, then a wide diffused cone falling from it,
          then a soft halo bloom behind the wordmark. */}
      <div className="absolute left-1/2 top-[-2%] size-20 -translate-x-1/2 ak-beam-source" />
      <div className="absolute left-1/2 top-[-1%] h-[70vh] w-[52rem] -translate-x-1/2 ak-beam" />
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
