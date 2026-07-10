/**
 * The hero's ambient backdrop: the two strong blueprint verticals that flank
 * the wordmark (running up through the navbar), faint outer verticals, a faint
 * line under the navbar, a narrow diffused light cone, a soft halo, and a
 * vignette. The horizontal frame lines, dots and x marks live in the hero
 * content itself (anchored to the text) so they stay perfectly registered to
 * the type; the verticals here share the same ±285px offsets so the
 * intersections land on the dots. Purely decorative.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Cool navy wash that lifts the upper-center into a lit atmosphere. */}
      <div className="absolute inset-x-0 top-0 h-[80vh] ak-ambient" />

      {/* Frame verticals hug the heading and run up through the navbar; faint
          outer verticals frame the whole. */}
      <VLine left="calc(50% - 285px)" strong />
      <VLine left="calc(50% + 285px)" strong />
      <VLine left="9%" />
      <VLine left="91%" />

      {/* A faint line under the navbar. */}
      <HLine top={92} />

      {/* Living multi-beam spotlight fanning from the top, a crisp source at the
          apex, then a halo bloom behind the wordmark. */}
      <div
        className="absolute inset-x-0 top-0 h-[86vh] overflow-hidden"
        style={{ fontSize: "clamp(11px, 1.5vw, 17px)" }}
      >
        <span className="ak-spot" style={spotVars("18deg")} />
        <span className="ak-spot" style={{ ...spotVars("-18deg"), animationDuration: "14s" }} />
        <span
          className="ak-spot"
          style={{ ...spotVars("0deg"), animationDuration: "21s", animationDirection: "reverse" }}
        />
      </div>
      <div className="absolute left-1/2 top-[-3%] size-24 -translate-x-1/2 ak-beam-source" />
      <div className="absolute inset-x-0 top-0 h-[52vh] ak-halo" />

      {/* Corners recede so the lit center is the focus. */}
      <div className="absolute inset-0 ak-vignette" />
    </div>
  );
}

/** Style for one spotlight beam: its base rotation, passed via the --r var. */
function spotVars(r: string): React.CSSProperties {
  return { ["--r" as string]: r } as React.CSSProperties;
}

function VLine({ left, strong = false }: { left: string; strong?: boolean }) {
  const a = strong ? 0.13 : 0.055;
  // Visible from the very top (behind the navbar), brightest around the heading,
  // fading out below the subtitle.
  return (
    <span
      className="absolute top-0 h-205 w-px"
      style={{
        left,
        background: `linear-gradient(to bottom, rgba(186,215,247,${a * 0.6}) 0%, rgba(186,215,247,${a}) 12%, rgba(186,215,247,${a}) 56%, transparent 100%)`,
      }}
    />
  );
}

function HLine({ top }: { top: number }) {
  return (
    <span
      className="absolute inset-x-0 h-px"
      style={{
        top,
        background:
          "linear-gradient(to right, transparent, rgba(186,215,247,0.05) 24%, rgba(186,215,247,0.05) 76%, transparent)",
      }}
    />
  );
}
