# Java / C++ sandbox — open questions

Per `CLAUDE.md`, Java and C++ are committed scope (Phase 9 of the roadmap)
but **not started** — the backend sandbox decision needs discussion before
any code gets written. This is a placeholder to collect the open questions
so that discussion has somewhere to start from.

Python and JavaScript both run entirely client-side (Pyodide WASM, and a
dedicated Web Worker respectively) — no backend was needed for either. Java
and C++ can't do that: both need a real compiler/runtime, so they need a
server-side sandbox.

## Open questions

- **Sandboxing approach** — a container per run (Docker), a pooled
  long-lived container, or a micro-VM (Firecracker/gVisor-style)? Cost and
  cold-start time trade off against isolation strength.
- **Tracing mechanism** — CLAUDE.md suggests GDB-MI for C++ (stepping via a
  debugger protocol) and source instrumentation for Java (a la the JS
  tracer, but at the bytecode or source level). Both are unproven for this
  project; either could turn out to be the "highest risk" part per the
  roadmap's own note that C++ is likeliest to slip.
- **Hosting cost** — the roadmap estimated ~$10-20/mo for a VPS; needs
  re-validating against actual sandboxing approach chosen.
- **Security boundary** — arbitrary user code executing on infrastructure we
  control is a materially different risk than a client-side worker; this
  needs its own threat model before it ships (see `SECURITY.md` for the
  current, much simpler, client-side-only guarantee).
- **Contract reuse** — whatever is built must still emit the same
  `Snapshot`/`ValueNode` shape (`src/types/snapshot.ts`) the rest of the app
  already consumes, so the UI doesn't need a rebuild.

No decisions are recorded here yet — this file exists so the discussion CLAUDE.md
asks for has a concrete place to start, not to pre-empt it.
