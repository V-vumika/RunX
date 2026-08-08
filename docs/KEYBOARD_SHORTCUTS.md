# Keyboard shortcuts

Active while the workspace (`/app`) has a trace loaded, and focus isn't in a
text input / textarea / contenteditable element:

| Key | Action |
|---|---|
| `→` | Step forward one line |
| `←` | Step backward one line |
| `Space` | Play / pause auto-stepping |

Source: `src/components/execution/ExecutionControls.tsx`. Interview mode's
`Timer` component has its own on-screen pause/resume/reset buttons (no
separate keyboard bindings).
