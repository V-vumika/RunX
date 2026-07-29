# Accessibility

RunX doesn't have a formal accessibility audit yet, but a few concrete
commitments are already in place and worth keeping honest as the app grows:

- **Icon-only controls get both `title` and `aria-label`.** A `title` alone
  isn't reliably announced by screen readers — see
  `src/components/interview/Timer.tsx` and
  `src/components/execution/ExecutionControls.tsx` for the pattern.
- **Keyboard parity for the step controls.** Every action exposed as a
  button in `ExecutionControls` (step forward/back, play/pause) also has a
  keyboard binding — see `docs/KEYBOARD_SHORTCUTS.md`. A title that mentions
  a shortcut (e.g. "Auto-play (Space)") means that shortcut must actually be
  wired up, not just documented.
- **shadcn/ui + Radix primitives** (`src/components/ui/`) are used for
  interactive controls (tabs, sliders, scroll areas) specifically because
  they ship correct keyboard/focus/ARIA behavior out of the box — prefer
  extending those over hand-rolling a new interactive primitive.

Not yet done: a full screen-reader pass over the visualizer canvases (most
are informational SVG/DOM trees without live-region announcements for
per-step changes), and a color-contrast audit of the AuthKit visual theme.
