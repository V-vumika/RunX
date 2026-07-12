import { VIZ, VIZ_GRADIENT_ACTIVE } from "@/lib/visualizers/palette";

/** Two-stop active-bar gradient shared by every SVG visualizer (the sheen the
 *  landing preview uses). Render once per <svg> and reference `fill="url(#viz-active)"`. */
export function VizGradientDefs() {
  return (
    <defs>
      <linearGradient id={VIZ_GRADIENT_ACTIVE} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor={VIZ.activeStrong} />
        <stop offset="100%" stopColor={VIZ.activeBar} />
      </linearGradient>
    </defs>
  );
}
