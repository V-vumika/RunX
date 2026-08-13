# Git Streak Plan v2 (2026-07-13 → 2026-08-11)

30 days, **2 real commits per day** — one authored as Shiv, one authored as
Vumi. Every task is a genuine fix (unused dependency, dead CSS, a stale doc,
a real lint warning, a real accessibility gap, a missing repo-hygiene file)
verified against the actual repo state on 2026-07-13, not filler.

This replaces the old single-commit/day `gitstreak.md` (2026-07-12). Its
Day 1 (remove `@paper-design/shaders-react`) and Day 2 (bump version to
1.0.0) are already done — this plan starts fresh from there.

## How to commit as each person (without touching git config)

Local git config on this machine is already `Shiv-Reddy
<shivkumarreddy043@gmail.com>` — so **Shiv commits need no special flags**:

```bash
git add <files>
git commit -m "<message>"
```

**Vumi commits** override author *and* committer for that one command only
(env vars, not `git config` — nothing persistent changes):

```bash
git add <files>
GIT_COMMITTER_NAME="V-vumika" GIT_COMMITTER_EMAIL="vumikabiswas40@gmail.com" \
  git commit --author="V-vumika <vumikabiswas40@gmail.com>" -m "<message>"
```

Push normally (`git push`) after each commit, or batch both of a day's
commits and push once — either is fine.

## A note on line numbers

Several files get touched more than once across this plan (`globals.css`,
`README.md`, `docs/ROADMAP.md`, `package.json`). Line numbers below are
accurate **as of 2026-07-13**, and tasks are ordered so earlier edits land
before later ones in the same file. If an earlier day was skipped or done
out of order, a quoted line number may have drifted — locate the block by
the quoted class name / heading / string instead of trusting the number
blindly.

---

## Day 1 — 2026-07-13

**Commit 1 (Shiv) — README: fix the stale "Status" section**
- File: `README.md`
- Replace lines 11–23 (the whole `## Status — Phase 1 (MVP)` section) with:
  ```markdown
  ## Status — v1.0

  Python and JavaScript are full, equal citizens end to end:

  - ✅ Monaco editor, Python + JavaScript
  - ✅ Per-line execution tracing for both languages (Pyodide `sys.settrace`
    for Python; AST instrumentation via acorn/astring for JavaScript), into a
    shared `Snapshot`/`ValueNode` contract
  - ✅ 11 algorithm/DSA visualizers, auto-selected from the trace
  - ✅ Rules-based time/space complexity analysis (no LLM — the class is
    always computed, never guessed)
  - ✅ LeetCode-paste support: a bare function/class is detected and given an
    inputs panel so it runs
  - ✅ Interview mode — practice DSA problems with a target complexity, both
    languages
  - ✅ Marketing landing page at `/`; the workspace lives at `/app`
  ```
- Commit message: `Update README status section`

**Commit 2 (Vumi) — Remove the unused "@xyflow/react" dependency**
- File: `package.json`
- Line 19: delete `"@xyflow/react": "^12.11.0",`
- Then run `npm uninstall @xyflow/react` (rewrites `package.json` +
  `package-lock.json` — commit both).
- Why: zero imports of `@xyflow/react` anywhere in `src/` — the old
  React-Flow-based tree/graph views were replaced by plain-SVG
  `TreeViz.tsx`/`GraphViz.tsx`.
- Commit message: `Remove unused @xyflow/react dependency`

## Day 2 — 2026-07-14

**Commit 1 (Shiv) — README: fix the stale "Tech stack" section**
- File: `README.md`
- Replace lines 24–34 (`## Tech stack` section) with:
  ```markdown
  ## Tech stack

  - **Framework:** Next.js 16 (App Router) + TypeScript
  - **Styling:** Tailwind CSS v4 + shadcn/ui (Radix)
  - **Editor:** Monaco (`@monaco-editor/react`)
  - **State:** Zustand
  - **Animation:** Framer Motion
  - **Graphs/trees:** plain SVG visualizers (`TreeViz`, `GraphViz`)
  - **Python execution:** Pyodide (loaded from CDN, runs in a classic Web Worker)
  - **JavaScript execution:** a dedicated Web Worker; source is instrumented
    with `acorn` (parse) + `astring` (regenerate) for the per-line trace
  - Later: a backend sandbox for Java/C++, Supabase (accounts/save)
  ```
- Commit message: `Update README tech stack section`

**Commit 2 (Vumi) — Remove the unused "d3" dependency**
- File: `package.json`
- Line 24: delete `"d3": "^7.9.0",`
- Then run `npm uninstall d3` (commit `package.json` + `package-lock.json`).
- Why: zero real imports in `src/` (only unrelated hex-color substring
  matches) — same history as `@xyflow/react`, this was the old tree-layout
  engine.
- Commit message: `Remove unused d3 dependency`

## Day 3 — 2026-07-15

**Commit 1 (Shiv) — README: fix the stale "Architecture" diagram**
- File: `README.md`
- Replace lines 36–57 (the whole `## Architecture` section including the code
  block and the paragraph after it) with:
  ```markdown
  ## Architecture

  ```
  Monaco Editor                          src/components/editor
     ↓
  Execution engine (per language)        public/workers/{pyodide,js}.worker.js
     ↓                                   src/lib/execution/{pyodide,js}-client.ts
  Entry synthesis (LeetCode-paste)       src/lib/execution/entry/
     ↓
  Snapshot trace                         (line, variables, call stack per step)
     ↓
  State store (Zustand)                  src/lib/store/execution-store.ts
     ↓
  Classifier + narrator (rules-based)    src/lib/explain/
     ↓
  Visualizer engine (11 visualizers)     src/components/visualizers
     ↓
  UI (Explain / Complexity / Output)     src/components
  ```

  The contract between every language's worker and the UI lives in
  `src/types/snapshot.ts` (`Snapshot`, `StackFrame`, `Variable`, `ValueNode`,
  `RunResult`). Adding a language means writing a new tracer that emits this
  same shape — not a UI rebuild.
  ```
- Commit message: `Update README architecture diagram`

**Commit 2 (Vumi) — Remove the unused "@types/d3" dependency**
- File: `package.json`
- Line 38: delete `"@types/d3": "^7.4.3",` from `devDependencies`
- Then run `npm uninstall @types/d3` (commit `package.json` +
  `package-lock.json`).
- Why: types for the `d3` package removed on Day 2 — no longer needed.
- Commit message: `Remove unused @types/d3 dependency`

## Day 4 — 2026-07-16

**Commit 1 (Shiv) — README: fix the stale "Project structure" section**
- File: `README.md`
- Replace lines 73–90 (`## Project structure` to end of file) with:
  ```markdown
  ## Project structure

  ```
  public/workers/         Execution workers (Python + JavaScript)
  src/app/                Next.js App Router: landing (/), workspace (/app),
                           interview mode (/app/interview)
  src/components/
    editor/                Monaco code editor + language selector
    execution/             Run/step controls, output, inputs, stdin
    inspector/             Recursive value renderer
    visualizers/           11 DSA visualizers
    interview/              Interview mode UI
    landing/                Marketing page sections
    ui/                     shadcn/ui primitives
  src/lib/
    execution/              Worker clients, entry synthesis, provider registry
    explain/                Rules-based classifier, narrator, complexity
    interview/               Interview problem bank + grading
    store/                   Zustand execution store
  src/types/               Shared snapshot/value types
  ```
  ```
- Commit message: `Update README project structure section`

**Commit 2 (Vumi) — Delete 2 unused default Next.js SVG assets**
- Delete `public/file.svg` and `public/globe.svg`
- Why: leftover `create-next-app` template icons — zero references to either
  filename anywhere in `src/`.
- Commit message: `Remove unused file.svg and globe.svg`

## Day 5 — 2026-07-17

**Commit 1 (Shiv) — Add a LICENSE file**
- New file: `LICENSE` (repo root)
- Content (MIT — swap the name/year if you want a different holder):
  ```
  MIT License

  Copyright (c) 2026 RunX

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  ```
- Commit message: `Add LICENSE`

**Commit 2 (Vumi) — Delete 2 more unused default Next.js SVG assets**
- Delete `public/next.svg` and `public/vercel.svg`
- Why: same as Day 4 — unused template icons, zero references.
- Commit message: `Remove unused next.svg and vercel.svg`

## Day 6 — 2026-07-18

**Commit 1 (Shiv) — Add a CONTRIBUTING.md**
- New file: `CONTRIBUTING.md` (repo root)
- Content:
  ```markdown
  # Contributing to RunX

  ## Setup
  ```bash
  npm install
  npm run dev
  ```
  Open http://localhost:3000/app. The first Python run downloads the Pyodide
  runtime (~10s on a typical connection); every run after that is instant.

  ## Before opening a PR
  ```bash
  npm run build   # must pass
  npm test        # must pass
  ```

  ## Where things live
  See the "Project structure" section in `README.md`, and `CLAUDE.md` for the
  fuller architecture/contract notes.
  ```
- Commit message: `Add CONTRIBUTING guide`

**Commit 2 (Vumi) — Delete the last unused default Next.js SVG asset**
- Delete `public/window.svg`
- Why: same as Days 4–5 — unused template icon, zero references. This closes
  out all 5 default `create-next-app` SVGs.
- Commit message: `Remove unused window.svg`

## Day 7 — 2026-07-19

**Commit 1 (Shiv) — Add robots.txt (Next.js metadata route)**
- New file: `src/app/robots.ts`
- Content:
  ```typescript
  import type { MetadataRoute } from "next";

  export default function robots(): MetadataRoute.Robots {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/sitemap.xml`,
    };
  }
  ```
- Commit message: `Add robots.txt route`

**Commit 2 (Vumi) — Delete dead CSS: `.runx-animated-flow`**
- File: `src/app/globals.css`
- Delete the comment + rule (currently around lines 146–154):
  ```css
  /* TreeView (and any other tree/graph React Flow canvas): animate a node's
     position when the layout reshapes (e.g. a new BST insert shifts siblings),
     instead of snapping instantly. React Flow positions nodes via a CSS
     `transform`, so a plain transition on that property is what actually
     produces the per-node slide — Framer Motion can't reach into React Flow's
     internal node positioning from outside. */
  .runx-animated-flow .react-flow__node {
    transition: transform 300ms ease;
  }
  ```
- Why: targets React Flow's internal node class; `runx-animated-flow` has
  zero usages anywhere, and React Flow itself was removed on Day 1.
- Commit message: `Remove dead runx-animated-flow CSS`

## Day 8 — 2026-07-20

**Commit 1 (Shiv) — Add sitemap.xml (Next.js metadata route)**
- New file: `src/app/sitemap.ts`
- Content:
  ```typescript
  import type { MetadataRoute } from "next";

  export default function sitemap(): MetadataRoute.Sitemap {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return [
      { url: base, changeFrequency: "monthly", priority: 1 },
      { url: `${base}/app`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${base}/app/interview`, changeFrequency: "monthly", priority: 0.6 },
    ];
  }
  ```
- Commit message: `Add sitemap route`

**Commit 2 (Vumi) — Delete dead CSS: `.ak-grid`**
- File: `src/app/globals.css`
- Delete the comment + rule (currently around lines 160–170):
  ```css
  /* Blueprint grid: 1px frost lines on the midnight canvas, faded at the edges. */
  .ak-grid {
    /* Horizontal rules only — the vertical framing lines are drawn explicitly in
       HeroBackdrop so we can show just the four that hug the wordmark. */
    background-image: linear-gradient(to bottom, rgba(186, 215, 247, 0.07) 1px, transparent 1px);
    /* Few, large cells, like the reference, instead of a dense mesh. */
    background-size: 220px 220px;
    background-position: center top;
    -webkit-mask-image: radial-gradient(ellipse 70% 55% at 50% 38%, #000 25%, transparent 78%);
    mask-image: radial-gradient(ellipse 70% 55% at 50% 38%, #000 25%, transparent 78%);
  }
  ```
- Why: `.ak-grid` has zero usages in any component (unlike `.ak-beam`,
  `.ak-glass`, `.ak-hairline` etc. right next to it, which are all used).
- Commit message: `Remove dead ak-grid CSS`

## Day 9 — 2026-07-21

**Commit 1 (Shiv) — Add .env.example**
- New file: `.env.example` (repo root)
- Content:
  ```
  # Base URL of the deployed site, used to resolve OG/Twitter share images.
  # Falls back to http://localhost:3000 in development.
  NEXT_PUBLIC_SITE_URL=https://your-domain.example
  ```
- Note: `.env*` is already gitignored — `.env.example` needs to be force-added:
  `git add -f .env.example`
- Commit message: `Add .env.example`

**Commit 2 (Vumi) — Delete dead CSS: `.ak-ambient`**
- File: `src/app/globals.css`
- Delete the comment + rule (currently around lines 207–210):
  ```css
  /* Cool navy wash over the whole hero, brightest at the top-center. */
  .ak-ambient {
    background: radial-gradient(ellipse 95% 62% at 50% 0%, rgba(42, 62, 116, 0.34), transparent 62%);
  }
  ```
- Why: zero usages anywhere (unlike `.ak-halo`/`.ak-vignette` nearby, which
  are used).
- Commit message: `Remove dead ak-ambient CSS`

## Day 10 — 2026-07-22

**Commit 1 (Shiv) — Fix a real Tailwind canonical-class warning**
- File: `src/components/ui/tabs.tsx`
- Line 29: find `p-[3px]` and replace with `p-0.75`
  (full line starts with `"bg-muted text-muted-foreground border-border/60 inline-flex h-9 w-fit items-center justify-center rounded-lg border p-[3px]",` — only the `p-[3px]` → `p-0.75` part changes)
- Commit message: `Use canonical padding class in Tabs`

**Commit 2 (Vumi) — Delete dead CSS: `.ak-spot`**
- File: `src/app/globals.css`
- Delete the comment + `@keyframes ak-spot` + `.ak-spot` rule (currently
  around lines 212–262 — the comment starting "Living multi-beam spotlight
  (particle-hero style)...", the `@keyframes ak-spot { ... }` block, and the
  `.ak-spot { ... }` block right after it).
- Why: zero usages anywhere in `src/` — this was an alternate spotlight
  effect that isn't wired into any component.
- Commit message: `Remove dead ak-spot CSS`

## Day 11 — 2026-07-23

**Commit 1 (Shiv) — Fix a real Tailwind canonical-class warning**
- File: `src/components/landing/authkit/HeroBackdrop.tsx`
- Line 48: find `w-[52rem]` and replace with `w-208`
  (full line: `<div className="absolute left-1/2 top-[-1%] h-[70vh] w-[52rem] -translate-x-1/2 ak-beam" />`)
- Commit message: `Use canonical width class in HeroBackdrop`

**Commit 2 (Vumi) — Delete dead CSS: `.ak-connector`**
- File: `src/app/globals.css`
- Delete the `@keyframes ak-march` + `.ak-connector` rule + its preceding
  comment (currently around lines 317–332):
  ```css
  /* Marching-dash connector between the feature-timeline tiles. */
  @keyframes ak-march {
    to {
      background-position-x: -17px;
    }
  }
  .ak-connector {
    height: 1px;
    background-image: repeating-linear-gradient(
      90deg,
      rgba(186, 215, 247, 0.32) 0 5px,
      transparent 5px 17px
    );
    background-size: 17px 1px;
    animation: ak-march 0.9s linear infinite;
  }
  ```
- Why: zero usages anywhere in `src/` — the feature-timeline doesn't use
  this connector.
- Commit message: `Remove dead ak-connector CSS`

## Day 12 — 2026-07-24

**Commit 1 (Shiv) — Fix a real Tailwind canonical-class warning**
- File: `src/components/landing/Hero.tsx`
- Line 291: find `min-w-[16px]` and replace with `min-w-4`
  (full line: `<span className="relative inline-flex min-w-[16px] justify-end overflow-hidden">`)
- Commit message: `Use canonical min-width class in Hero`

**Commit 2 (Vumi) — Delete dead CSS: `.ak-float`**
- File: `src/app/globals.css`
- Delete the comment + `@keyframes ak-float` + `.ak-float` rule (currently
  around lines 334–346):
  ```css
  /* Gentle continuous float for the hero glass plates. */
  @keyframes ak-float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  .ak-float {
    animation: ak-float 6s ease-in-out infinite;
  }
  ```
- Why: zero usages anywhere in `src/`.
- Commit message: `Remove dead ak-float CSS`

## Day 13 — 2026-07-25

**Commit 1 (Shiv) — Fix stale docs/TASKS.md referencing deleted components**
- File: `docs/TASKS.md`
- Find the "Phase 3 — Memory boxes" bullet (references `MemoryView`) and the
  "Phase 4 — Call-stack polish" bullet (references `CallStackPanel`) in the
  `## ✅ Done` section.
- Both components were deleted on 2026-07-12 (dead code, zero references —
  superseded by the current structure-detection + narration approach). Add a
  short note after each bullet, e.g.:
  `  _(MemoryView was later removed — superseded by live structure detection in \`src/lib/visualizers/detect-live.ts\`.)_`
  and similarly for CallStackPanel → superseded by call-stack narration in
  `src/lib/explain/narrate.ts`.
- Commit message: `Note removed components in TASKS.md`

**Commit 2 (Vumi) — Delete dead CSS: `.ak-pulse` and clean up prefers-reduced-motion**
- File: `src/app/globals.css`
- Delete the comment + `@keyframes ak-pulse` + `.ak-pulse` rule (currently
  around lines 348–360):
  ```css
  /* Soft pulsing glow used on hover / active accents. */
  @keyframes ak-pulse {
    0%,
    100% {
      opacity: 0.35;
    }
    50% {
      opacity: 0.7;
    }
  }
  .ak-pulse {
    animation: ak-pulse 2.4s ease-in-out infinite;
  }
  ```
- Then delete the `@media (prefers-reduced-motion: reduce) { ... }` block
  right after it (currently around lines 362–369) — it only disabled
  animation on `.ak-connector`, `.ak-float`, `.ak-pulse`, `.ak-spot`, all four
  of which are now removed (Days 8, 10, 11, 12, 13), so the block is dead too.
- Commit message: `Remove dead ak-pulse CSS and empty reduced-motion block`

## Day 14 — 2026-07-26

**Commit 1 (Shiv) — Tick two stale checkboxes in docs/ROADMAP.md**
- File: `docs/ROADMAP.md`
- Line 95: change
  `- [ ] 🔵 (Day 7–11) **JavaScript tracer** — AST instrumentation, dedicated Web Worker, mapped into \`ValueNode\``
  → `- [x] 🔵 (Day 7–11) **JavaScript tracer** — AST instrumentation, dedicated Web Worker, mapped into \`ValueNode\` — done 2026-07-12`
- Line 115: change
  `- [ ] 🔵 interview mode: solve a DSA problem → complexity + optimization tips, reusing Phase 8's detector — **scoped to Python first**; multi-language interview mode is a stretch goal past day 40`
  → `- [x] 🔵 interview mode: solve a DSA problem → complexity + optimization tips, reusing Phase 8's detector — shipped 2026-07-12 for **both Python and JavaScript** (ahead of the original Python-first plan)`
- Commit message: `Tick completed roadmap items`

**Commit 2 (Vumi) — Fix Tailwind arbitrary value in LinkedListViz**
- File: `src/components/visualizers/LinkedListViz.tsx`
- Lines 123 and 129: find `pt-[18px]` (appears twice, once on the head-pointer
  div and once on the empty-list div) and replace both with `pt-4.5`
  (18px = 4.5 × 4px spacing unit, exact match).
- Commit message: `Use canonical padding class in LinkedListViz (18px)`

## Day 15 — 2026-07-27

**Commit 1 (Shiv) — README: add a Deploy section**
- File: `README.md`
- Add this new section at the end of the file (after the "Project structure"
  section from Day 4):
  ```markdown
  ## Deploy

  RunX is a static-friendly Next.js app with no backend/database dependency
  for Python + JavaScript (Pyodide loads from a CDN; JS runs in its own
  worker). To deploy on Vercel:

  1. Import the repo at vercel.com (Add New → Project → pick this repo).
  2. Leave build settings on their Next.js defaults.
  3. After the first deploy, set `NEXT_PUBLIC_SITE_URL` to your assigned
     domain in Project Settings → Environment Variables, then redeploy.
  ```
- Commit message: `Add README deploy section`

**Commit 2 (Vumi) — Fix Tailwind arbitrary value in LinkedListViz**
- File: `src/components/visualizers/LinkedListViz.tsx`
- Lines 171 and 178: find `pt-[26px]` (the arrow-to-next-node span, appears
  twice — once between nodes, once as the terminator arrow) and replace both
  with `pt-6.5` (26px = 6.5 × 4px, exact match).
- Commit message: `Use canonical padding class in LinkedListViz (26px)`

## Day 16 — 2026-07-28

**Commit 1 (Shiv) — package.json: add repository/author/license metadata**
- File: `package.json`
- After the `"description"` line, add:
  ```json
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/V-vumika/RunX.git"
  },
  ```
- Commit message: `Add package.json repository metadata`

**Commit 2 (Vumi) — Fix Tailwind arbitrary value in Hero**
- File: `src/components/landing/Hero.tsx`
- Line 200: find `h-[460px]` and replace with `h-115` (460px = 115 × 4px,
  exact match)
  (full line: `<div className="flex h-[460px] flex-col px-5 pb-5 pt-4">`)
- Commit message: `Use canonical height class in Hero`

## Day 17 — 2026-07-29

**Commit 1 (Shiv) — Accessibility: label the Timer's icon-only buttons**
- File: `src/components/interview/Timer.tsx`
- Pause/resume button (has `title` but no `aria-label`): add right after the
  `title={...}` line:
  ```tsx
  aria-label={running ? "Pause timer" : "Resume timer"}
  ```
- Reset button (`title="Reset timer"` only): add right after that line:
  ```tsx
  aria-label="Reset timer"
  ```
- Commit message: `Add aria-labels to Timer buttons`

**Commit 2 (Vumi) — Accessibility: label 3 of ExecutionControls' icon buttons**
- File: `src/components/execution/ExecutionControls.tsx`
- Line 91 area (`SkipBack`, `title="Jump to start"`): add right after the
  `title` line: `aria-label="Jump to start"`
- Line 99 area (`ChevronLeft`, `title="Step back (←)"`): add right after:
  `aria-label="Step back"`
- Line 109 area (Play/Pause toggle, `title={isPlaying ? "Pause (Space)" :
  "Auto-play"}`): add right after: `aria-label={isPlaying ? "Pause" :
  "Auto-play"}`
- Commit message: `Add aria-labels to ExecutionControls step/play buttons`

## Day 18 — 2026-07-30

**Commit 1 (Shiv) — README: add a badges row**
- File: `README.md`
- At line 1, right after the `# RunX` heading, add a new line:
  ```markdown
  ![Build](https://img.shields.io/github/actions/workflow/status/V-vumika/RunX/build.yml?branch=main) ![License](https://img.shields.io/badge/license-MIT-blue)
  ```
- Note: the build badge assumes the CI workflow from Day 26 exists — if you
  haven't reached that day yet, skip the build badge for now and just keep
  the license one.
- Commit message: `Add README badges`

**Commit 2 (Vumi) — Accessibility: label the last 2 of ExecutionControls' icon buttons**
- File: `src/components/execution/ExecutionControls.tsx`
- Line 120 area (`ChevronRight`, `title="Step forward (→)"`): add right
  after: `aria-label="Step forward"`
- Line 128 area (`RotateCcw`, `title="Clear trace"`): add right after:
  `aria-label="Clear trace"`
- Commit message: `Add aria-labels to ExecutionControls reset button`

---

## Day 19 — 2026-07-31

**Commit 1 (Shiv) — Fix stale docs/ARCHITECTURE.md — JS tracer described as not existing**
- File: `docs/ARCHITECTURE.md`
- In the JS client bullet, replace the paragraph currently reading:
  ```
  - `javascript` → `js-client.ts` + `public/workers/js.worker.js` — executes via
    `AsyncFunction` inside a plain worker (never main-thread eval), captures
    console output + `prompt()`/`readline()` stdin, returns a `RunResult` with
    ONE synthetic `final` snapshot carrying stdout. No per-line tracer yet
    (Phase 9); Explain shows a Python-only notice meanwhile. Complexity DOES
    work for JS: `src/lib/explain/lang/` (per-language profiles) statically
    analyzes the source and the store fills `result.complexity` from it.
  ```
  with:
  ```
  - `javascript` → `js-client.ts` + `public/workers/js.worker.js` — executes via
    `AsyncFunction` inside a plain worker (never main-thread eval). Source is
    instrumented on the main thread first (`src/lib/execution/js-tracer/instrument.ts`,
    acorn + astring), so the worker emits a full per-line `Snapshot[]` — line,
    call, and return events with captured return values — same as Python.
    Explain and all visualizers work for JS. Complexity also works for JS:
    `src/lib/explain/lang/` (per-language profiles) statically analyzes the
    source and the store fills `result.complexity` from it.
  ```
- Commit message: `Update ARCHITECTURE.md for the JS tracer`

**Commit 2 (Vumi) — Remove an unused catch-binding (lint warning)**
- File: `public/workers/js.worker.js`
- Line 101: change
  ```js
  } catch (e) {
    /* proxies etc. */
  }
  ```
  to
  ```js
  } catch {
    /* proxies etc. */
  }
  ```
- Why: `e` is never referenced in this catch block — real
  `@typescript-eslint/no-unused-vars` warning.
- Commit message: `Remove unused catch binding in js.worker.js`

## Day 20 — 2026-08-01

**Commit 1 (Shiv) — Add .editorconfig**
- New file: `.editorconfig` (repo root)
- Content:
  ```ini
  root = true

  [*]
  indent_style = space
  indent_size = 2
  end_of_line = lf
  charset = utf-8
  trim_trailing_whitespace = true
  insert_final_newline = true

  [*.md]
  trim_trailing_whitespace = false
  ```
- Commit message: `Add .editorconfig`

**Commit 2 (Vumi) — Remove another unused catch-binding (lint warning)**
- File: `public/workers/js.worker.js`
- Line 184: change
  ```js
  } catch (e) {
    keys = [];
  }
  ```
  to
  ```js
  } catch {
    keys = [];
  }
  ```
- Commit message: `Remove unused catch binding in js.worker.js (keys)`

## Day 21 — 2026-08-02

**Commit 1 (Shiv) — Add .gitattributes**
- New file: `.gitattributes` (repo root)
- Content:
  ```
  * text=auto eol=lf
  *.png binary
  *.jpg binary
  *.ico binary
  ```
- Why: keeps line endings consistent across Windows/Mac/Linux contributors —
  worth having now that this is a public v1.0 repo.
- Commit message: `Add .gitattributes`

**Commit 2 (Vumi) — Remove a third unused catch-binding (lint warning)**
- File: `public/workers/js.worker.js`
- Line 193: change
  ```js
  } catch (e) {
    continue; // skip throwing getters
  }
  ```
  to
  ```js
  } catch {
    continue; // skip throwing getters
  }
  ```
- Note: two other `catch (e)` blocks exist further down (~334, ~374) — leave
  those alone, they actually use `e`.
- Commit message: `Remove unused catch binding in js.worker.js (getters)`

## Day 22 — 2026-08-03

**Commit 1 (Shiv) — package.json: pin the Node version and add keywords**
- File: `package.json`
- After the `"repository"` block added on Day 16, add:
  ```json
  "engines": {
    "node": ">=20"
  },
  "keywords": [
    "code-visualizer",
    "algorithm-visualizer",
    "dsa",
    "python",
    "javascript",
    "education"
  ],
  ```
- Commit message: `Pin Node engine and add keywords`

**Commit 2 (Vumi) — Remove an unused eslint-disable comment**
- File: `public/workers/pyodide.worker.js`
- Line 25: delete the line `// eslint-disable-next-line no-undef` directly
  above `importScripts(PYODIDE_BASE + "pyodide.js");`
- Why: ESLint reports this as an "unused eslint-disable directive" (nothing
  on the next line currently triggers `no-undef`).
- Note: run `npx eslint public/workers/pyodide.worker.js` after removing to
  confirm no new warning appears before committing.
- Commit message: `Remove unused eslint-disable in pyodide.worker.js`

## Day 23 — 2026-08-04

**Commit 1 (Shiv) — Add CHANGELOG.md**
- New file: `CHANGELOG.md` (repo root)
- Content:
  ```markdown
  # Changelog

  ## 1.0.0 — 2026-07-12
  - Python and JavaScript execution tracing at full parity (per-line snapshots,
    call/return events, captured return values)
  - 11 algorithm/DSA visualizers, auto-selected from the trace
  - Rules-based time/space complexity analysis for both languages
  - LeetCode-style paste support (entry-point detection + inputs panel)
  - Interview mode — Python and JavaScript
  - Redesigned marketing landing page
  ```
- Commit message: `Add CHANGELOG for 1.0.0`

**Commit 2 (Vumi) — Remove another unused eslint-disable comment**
- File: `public/workers/pyodide.worker.js`
- Line 391: delete the line `// eslint-disable-next-line no-undef` directly
  above `pyodide = await loadPyodide({ indexURL: PYODIDE_BASE });`
- Note: run `npx eslint public/workers/pyodide.worker.js` after removing to
  confirm no new warning appears before committing.
- Commit message: `Remove unused eslint-disable in pyodide.worker.js (loadPyodide)`

## Day 24 — 2026-08-05

**Commit 1 (Shiv) — Add a GitHub bug report issue template**
- New file: `.github/ISSUE_TEMPLATE/bug_report.md`
- Content:
  ```markdown
  ---
  name: Bug report
  about: Something in RunX isn't working as expected
  title: ""
  labels: bug
  ---

  **What happened**


  **What you expected**


  **Code that reproduces it** (language + the snippet you ran)


  **Browser / OS**
  ```
- Commit message: `Add bug report issue template`

**Commit 2 (Vumi) — Remove an unused eslint-disable comment in a test file**
- File: `src/lib/execution/js-tracer/instrument.test.ts`
- Line 31: delete the line
  `// eslint-disable-next-line @typescript-eslint/no-implied-eval` directly
  above `const fn = new Function(...)`.
- Note: run `npx eslint src/lib/execution/js-tracer/instrument.test.ts` after
  removing to confirm no new warning appears before committing.
- Commit message: `Remove unused eslint-disable in instrument.test.ts`

## Day 25 — 2026-08-06

**Commit 1 (Shiv) — Add a GitHub pull request template**
- New file: `.github/PULL_REQUEST_TEMPLATE.md`
- Content:
  ```markdown
  ## What changed

  ## Why

  ## Checklist
  - [ ] `npm run build` passes
  - [ ] `npm test` passes
  ```
- Commit message: `Add pull request template`

**Commit 2 (Vumi) — Fix CLAUDE.md's stale stack line**
- File: `CLAUDE.md`
- Line 9: find
  `Zustand, Pyodide 0.28.3 (loaded from CDN, runs in a classic Web Worker), Monaco, Framer Motion, React Flow (\`@xyflow/react\`) + \`d3\`/\`d3-hierarchy\`, **acorn + astring**`
  and replace with
  `Zustand, Pyodide 0.28.3 (loaded from CDN, runs in a classic Web Worker), Monaco, Framer Motion, plain-SVG tree/graph visualizers (React Flow and d3 were removed 2026-07-13 — zero imports), **acorn + astring**`
- Why: `@xyflow/react` and `d3` were removed on Days 1–3 of this plan; the
  doc still describes them as installed.
- Commit message: `Update CLAUDE.md stack description`

## Day 26 — 2026-08-07

**Commit 1 (Shiv) — Add a minimal CI workflow**
- New file: `.github/workflows/build.yml`
- Content:
  ```yaml
  name: build
  on:
    push:
      branches: [main]
    pull_request:
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 20
        - run: npm install
        - run: npm test
        - run: npm run build
  ```
- Why: this is also what the README badge added on Day 18 points at.
- Commit message: `Add CI workflow`

**Commit 2 (Vumi) — Fix stale docs/ROADMAP.md Phase 3 checklist**
- File: `docs/ROADMAP.md`
- Lines 64–67, the `### Phase 3 — Memory boxes ✅ DONE` section, currently:
  ```markdown
  ### Phase 3 — Memory boxes ✅ DONE
  - [x] 🟣 `MemoryView` — draw each variable as a box (name + value)
  - [x] 🔵 use `ValueNode.id` to show shared references / aliasing — `src/lib/visualizers/aliasing.ts` (`buildAliasMap`)
  - [x] 🔵 wire into the workspace layout — Memory tab + `MemoryView` scaffold
  ```
  Replace with:
  ```markdown
  ### Phase 3 — Memory boxes ✅ DONE (superseded)
  - [x] 🟣 `MemoryView` — draw each variable as a box (name + value) — _later removed; superseded by live structure detection in `src/lib/visualizers/detect-live.ts`_
  - [x] 🔵 use `ValueNode.id` to show shared references / aliasing — _`aliasing.ts`/`buildAliasMap` later removed along with `MemoryView`_
  - [x] 🔵 wire into the workspace layout — _Memory tab removed with `MemoryView`_
  ```
- Why: `MemoryView.tsx` and `src/lib/visualizers/aliasing.ts` (`buildAliasMap`)
  no longer exist in `src/` — zero references confirmed.
- Commit message: `Fix stale Phase 3 checklist in ROADMAP.md`

## Day 27 — 2026-08-08

**Commit 1 (Shiv) — Add SECURITY.md**
- New file: `SECURITY.md` (repo root)
- Content:
  ```markdown
  # Security

  RunX executes user-submitted code entirely client-side, in isolated
  sandboxes: Python runs inside a Pyodide Web Worker, JavaScript runs inside
  its own dedicated Web Worker via `AsyncFunction` (never `eval`, never the
  main thread). Neither has access to the DOM, the network, or the rest of the
  page.

  If you find a way for submitted code to escape its worker sandbox, or any
  other security issue, please open a GitHub issue with the details.
  ```
- Commit message: `Add SECURITY.md`

**Commit 2 (Vumi) — Fix stale docs/ROADMAP-NEXT.md aliasing/MemoryView section**
- File: `docs/ROADMAP-NEXT.md`
- Lines 33–36, currently:
  ```markdown
  - ✅ **5.2 Object / reference memory view** — reused `aliasing.ts` (`buildAliasMap`) + new `collectSharedRefs`
    and `MemoryView.tsx`: when 2+ names/slots point at the same object (`a = b = []`, `grid = [row, row]`),
    they share one colored box with a "mutating one changes all" note. Renders only when real sharing exists.
    4 tests.
  ```
  Replace with:
  ```markdown
  - ✅ **5.2 Object / reference memory view** — _(this originally shipped via `aliasing.ts`/`buildAliasMap` +
    `collectSharedRefs` + `MemoryView.tsx`; all three were later removed and superseded by live structure
    detection in `src/lib/visualizers/detect-live.ts`, which covers shared-reference display differently.)_
  ```
- Why: `aliasing.ts`, `collectSharedRefs`, and `MemoryView.tsx` no longer
  exist in `src/` — zero references confirmed.
- Commit message: `Fix stale aliasing/MemoryView note in ROADMAP-NEXT.md`

## Day 28 — 2026-08-09

**Commit 1 (Shiv) — next.config.ts: drop the X-Powered-By header**
- File: `next.config.ts`
- Current content:
  ```typescript
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    /* config options here */
  };

  export default nextConfig;
  ```
- Replace the `const nextConfig` block with:
  ```typescript
  const nextConfig: NextConfig = {
    poweredByHeader: false,
  };
  ```
- Why: Next.js sends an `X-Powered-By: Next.js` response header by default —
  small, harmless information disclosure, one line to turn off.
- Commit message: `Disable the X-Powered-By header`

**Commit 2 (Vumi) — Fix stale docs/ROADMAP.md Phase 7 section**
- File: `docs/ROADMAP.md`
- Lines 82–87, currently:
  ```markdown
  ### Phase 7 — Trees & graphs (Day 1–3) 🚧 IN PROGRESS
  - [x] 🔵 structure detection for tree/graph shapes + baseline `TreeView` (React Flow + D3)
  - [x] 🟣 polish `TreeView` (card style, legend, null-leaf indicator)
  - [x] 🔵 reshape-animation fix (real CSS `transform` transition) — this is the pattern every future animated view should follow; Framer Motion alone can't reach into React Flow's node positioning
  - [ ] 🟣 `GraphView` with React Flow + D3
  - [ ] 🔵 BFS / DFS / Dijkstra step animations
  ```
  Replace with:
  ```markdown
  ### Phase 7 — Trees & graphs ✅ DONE (2026-07-13 — updated for the React-Flow/D3 removal)
  - [x] 🔵 structure detection for tree/graph shapes + baseline `TreeViz` (plain SVG — React Flow/D3 were later removed, zero imports)
  - [x] 🟣 polish `TreeViz` (card style, legend, null-leaf indicator)
  - [x] 🔵 reshape-animation fix (real CSS `transform` transition)
  - [x] 🟣 `GraphViz` (plain SVG)
  - [x] 🔵 BFS / DFS / Dijkstra step animations
  ```
- Why: this section was already fully done per `CLAUDE.md`'s build plan, but
  still had 2 unchecked boxes and described dead dependencies.
- Commit message: `Fix stale Phase 7 section in ROADMAP.md`

---

## Day 29 — 2026-08-10

**Commit 1 (Shiv) — Fix docs/ARCHITECTURE.md's outdated store section**
- File: `docs/ARCHITECTURE.md`
- Lines 82–86, currently:
  ```markdown
  State: `code, language, snapshots, currentStep, isRunning, result, engineStatus`
  (+ per-language code buffers, so switching languages never loses work).
  Actions: `setCode, setLanguage, initEngine, run, stepForward, stepBackward,
  goToStep, reset`. Selector: `selectCurrentSnapshot(state)`. `initEngine`/`run`
  resolve the engine through `getExecutionClient(language)`.
  ```
  Replace with:
  ```markdown
  State: `code, language, snapshots, currentStep, isRunning, result, engineStatus,
  stdin, inputs, entry, isPlaying, playSpeed` (+ per-language code buffers, so
  switching languages never loses work).
  Actions: `setCode, setLanguage, initEngine, run, stepForward, stepBackward,
  goToStep, reset, setInput, setStdin, togglePlay, setPlaySpeed, pause`.
  Selector: `selectCurrentSnapshot(state)`. `initEngine`/`run` resolve the
  engine through `getExecutionClient(language)`.
  ```
- Why: `src/lib/store/execution-store.ts` has had `stdin`, `inputs`, `entry`,
  `isPlaying`, `playSpeed` state and `setStdin`, `setInput`, `togglePlay`,
  `setPlaySpeed`, `pause` actions for a while — none were documented.
- Commit message: `Document stdin/play-control store fields in ARCHITECTURE.md`

**Commit 2 (Vumi) — README: fix the stale "AI explanation layer" line**
- File: `README.md`
- Lines 5–9, currently:
  ```markdown
  RunX lets you **run code step-by-step**, **visualize data structures and
  algorithms** in real time, and (later) **analyze time/space complexity** with an
  AI explanation layer. The goal is to replace the opaque "Code → Output" mental
  model with visibility into execution, memory, variables, the call stack, and
  data-structure changes.
  ```
  Replace with:
  ```markdown
  RunX lets you **run code step-by-step**, **visualize data structures and
  algorithms** in real time, and **analyze time/space complexity** with a
  rules-based detector (no LLM — the class is always computed, never guessed).
  The goal is to replace the opaque "Code → Output" mental model with
  visibility into execution, memory, variables, the call stack, and
  data-structure changes.
  ```
- Why: the "AI explanation layer" (per-step LLM teacher) was cancelled
  2026-07-07 per `CLAUDE.md` — complexity analysis is, and always will be,
  rules-based.
- Commit message: `Fix stale AI-explanation mention in README intro`

## Day 30 — 2026-08-11

**Commit 1 (Shiv) — Add a web app manifest (Next.js metadata route)**
- New file: `src/app/manifest.ts`
- Content:
  ```typescript
  import type { MetadataRoute } from "next";

  export default function manifest(): MetadataRoute.Manifest {
    return {
      name: "RunX",
      short_name: "RunX",
      description: "An AI-powered code-execution, DSA, and complexity visualizer for students.",
      start_url: "/app",
      display: "standalone",
      background_color: "#0b0b16",
      theme_color: "#0b0b16",
      icons: [],
    };
  }
  ```
- Then in `src/app/layout.tsx`, add `manifest: "/manifest.webmanifest"` to
  the exported `metadata` object (alongside the existing fields there).
- Why: `src/app` already has `icon.tsx` and `opengraph-image.tsx` but no web
  manifest — a real gap for "add to home screen" / PWA-lite behavior.
- Commit message: `Add web app manifest`

**Commit 2 (Vumi) — Fix a components.json whitespace inconsistency**
- File: `components.json`
- Line 8: currently ` "baseColor": "neutral",` has 1 leading space where
  every sibling key (`"config"` on line 6, `"cssVariables"` on line 9) has 4.
  Fix the indentation to match: `    "baseColor": "neutral",`
- Commit message: `Fix indentation in components.json`

---

## After day 30

By 2026-08-11 the repo will have: an accurate README + docs, LICENSE,
CONTRIBUTING, SECURITY.md, CHANGELOG, robots.txt/sitemap/manifest, GitHub
issue/PR templates, a CI workflow, editor/git hygiene files, no unused
dependencies or dead CSS, several real lint fixes, and a handful of
accessibility fixes — 60 genuine commits, split evenly between Shiv and
Vumi. If you're still between projects after this, the next real,
non-trivial work is listed in `CLAUDE.md`'s "Build plan" section (Java/C++
tracer, Supabase accounts, watch-variables) — those need actual design
decisions, not one-line fixes, so they don't belong in a streak list.
