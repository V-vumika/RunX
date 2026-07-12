/**
 * Shared color palette for the algorithm visualizers (SortViz, TreeViz,
 * GraphViz, BinarySearchViz, RecursionViz, IterativeViz, HeapViz, …).
 *
 * Before this, each visualizer hardcoded its own hex palette — close to the
 * app's periwinkle/violet/teal brand but not the same values, so the
 * visualizers looked like a different, older product bolted onto the app.
 * These are the exact values already proven in the landing's mini-visualizer
 * previews (VisualizerShowcase) and the AuthKit surfaces elsewhere in the
 * app, extracted here so every visualizer draws from one source of truth.
 *
 * Four semantic buckets cover almost every visualizer state:
 *  - IDLE: not yet touched / default.
 *  - ACTIVE: being examined right now (comparing, visiting, the current node).
 *  - PENDING: queued but not yet processed (a graph's frontier, a heap).
 *  - DONE: finished / sorted / visited / found.
 * A visualizer with more states (e.g. a "path" or "target" highlight) can add
 * its own accent on top — these four cover the common case. Pending reuses
 * the amber already used for the editor's current-line marker and the
 * "highlighted" bar in the landing's memory motif (`#efb54a`) — the app's one
 * warm "attention" hue, kept distinct from active/done so a queued item never
 * reads as already-being-processed or already-finished.
 */

export const VIZ = {
  /** Canvas / cell background — matches the editor and card surfaces. */
  canvasBg: "#0a0e1c",

  /** Default (idle) cell. */
  idleFill: "rgba(199, 211, 234, 0.05)",
  idleBorder: "rgba(186, 215, 247, 0.14)",
  idleText: "#9da7ba", // fog
  idleTextFaint: "rgba(157, 167, 186, 0.6)",
  /** Default (idle) bar / edge / line. */
  idleBar: "rgba(199, 211, 234, 0.16)",
  idleLine: "rgba(186, 215, 247, 0.16)",

  /** Active — periwinkle/violet, "this is being examined right now". */
  activeFill: "rgba(102, 58, 243, 0.16)",
  activeBorder: "rgba(155, 140, 247, 0.5)",
  activeText: "#cdbffb",
  activeBar: "#9b8cf7",
  activeStrong: "#663af3",
  activeLine: "rgba(155, 140, 247, 0.6)",

  /** Done — teal, "finished / sorted / visited / found". */
  doneFill: "rgba(127, 215, 192, 0.14)",
  doneBorder: "rgba(127, 215, 192, 0.5)",
  doneText: "#a9ecd8",
  doneBar: "#7fd7c0",
  doneLine: "rgba(127, 215, 192, 0.55)",

  /** Pending — amber, "queued / in the frontier, not processed yet". */
  pendingFill: "rgba(239, 181, 74, 0.14)",
  pendingBorder: "rgba(239, 181, 74, 0.55)",
  pendingText: "#f2c674",
  pendingBar: "#efb54a",
} as const;

/** Shared gradient element ids — see VizGradientDefs in the visualizers dir. */
export const VIZ_GRADIENT_ACTIVE = "viz-active";
