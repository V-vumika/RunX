# Git Streak Plan (2026-07-13 → 2026-08-11)

30 small, real, safe changes — one per day. Every task here is a genuine fix
(stale docs, a missing file, an unused dependency, a real lint warning, a real
accessibility gap) found by actually auditing the repo on 2026-07-12, not
filler. Each entry tells you the exact file, the exact line(s), and the exact
before → after. Commit one per day, in order or in any order — they're
independent.

Suggested commit message is given per day; keep them short, no dashes (matches
this repo's commit-message convention).

---

## Day 1 — 2026-07-13
**Remove the unused shader dependency**
- File: `package.json`
- Line 14: delete the line `"@paper-design/shaders-react": "^0.0.77",`
- Then run: `npm uninstall @paper-design/shaders-react` (this rewrites `package.json` and `package-lock.json` for you — just commit both).
- Why: the shader-based hero was replaced by the current hero back on 2026-07-12; nothing in `src/` imports this package anymore (verified: zero matches).
- Commit message: `Remove unused shader dependency`

## Day 2 — 2026-07-14
**Bump the version to match the v1.0 milestone**
- File: `package.json`
- Line 3: change `"version": "0.1.0",` → `"version": "1.0.0",`
- Also add a description field right after line 4 (`"private": true,`):
  ```json
  "description": "An AI-powered code-execution, DSA, and complexity visualizer for students.",
  ```
- Commit message: `Bump version to 1.0.0`

## Day 3 — 2026-07-15
**README: fix the stale "Status" section**
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

## Day 4 — 2026-07-16
**README: fix the stale "Tech stack" section**
- File: `README.md`
- Replace lines 24–34 (`## Tech stack` section) with:
  ```markdown
  ## Tech stack

  - **Framework:** Next.js 16 (App Router) + TypeScript
  - **Styling:** Tailwind CSS v4 + shadcn/ui (Radix)
  - **Editor:** Monaco (`@monaco-editor/react`)
  - **State:** Zustand
  - **Animation:** Framer Motion
  - **Graphs/trees:** React Flow (`@xyflow/react`) + `d3`/`d3-hierarchy`
  - **Python execution:** Pyodide (loaded from CDN, runs in a classic Web Worker)
  - **JavaScript execution:** a dedicated Web Worker; source is instrumented
    with `acorn` (parse) + `astring` (regenerate) for the per-line trace
  - Later: a backend sandbox for Java/C++, Supabase (accounts/save)
  ```
- Commit message: `Update README tech stack section`

## Day 5 — 2026-07-17
**README: fix the stale "Architecture" diagram**
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

## Day 6 — 2026-07-18
**README: fix the stale "Project structure" section**
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

## Day 7 — 2026-07-19
**Add a LICENSE file**
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

## Day 8 — 2026-07-20
**Add a CONTRIBUTING.md**
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

## Day 9 — 2026-07-21
**Add robots.txt (Next.js metadata route)**
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

## Day 10 — 2026-07-22
**Add sitemap.xml (Next.js metadata route)**
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

## Day 11 — 2026-07-23
**Add .env.example**
- New file: `.env.example` (repo root)
- Content:
  ```
  # Base URL of the deployed site, used to resolve OG/Twitter share images.
  # Falls back to http://localhost:3000 in development.
  NEXT_PUBLIC_SITE_URL=https://your-domain.example
  ```
- Note: `.env*` is already gitignored — `.env.example` needs to be force-added
  since it matches that pattern: `git add -f .env.example`
- Commit message: `Add .env.example`

## Day 12 — 2026-07-24
**Fix a real Tailwind canonical-class warning**
- File: `src/components/ui/tabs.tsx`
- Line 29: find `p-[3px]` and replace with `p-0.75`
  (full line starts with `"bg-muted text-muted-foreground border-border/60 inline-flex h-9 w-fit items-center justify-center rounded-lg border p-[3px]",` — only the `p-[3px]` → `p-0.75` part changes)
- Commit message: `Use canonical padding class in Tabs`

## Day 13 — 2026-07-25
**Fix a real Tailwind canonical-class warning**
- File: `src/components/landing/authkit/HeroBackdrop.tsx`
- Line 48: find `w-[52rem]` and replace with `w-208`
  (full line: `<div className="absolute left-1/2 top-[-1%] h-[70vh] w-[52rem] -translate-x-1/2 ak-beam" />`)
- Commit message: `Use canonical width class in HeroBackdrop`

## Day 14 — 2026-07-26
**Fix a real Tailwind canonical-class warning**
- File: `src/components/landing/Hero.tsx`
- Line 291: find `min-w-[16px]` and replace with `min-w-4`
  (full line: `<span className="relative inline-flex min-w-[16px] justify-end overflow-hidden">`)
- Commit message: `Use canonical min-width class in Hero`

## Day 15 — 2026-07-27
**Fix stale docs/TASKS.md referencing deleted components**
- File: `docs/TASKS.md`
- Find the "Phase 3 — Memory boxes" bullet (line 11, references `MemoryView`)
  and the "Phase 4 — Call-stack polish" bullet (line 12, references
  `CallStackPanel`) in the `## ✅ Done` section.
- Both components were deleted on 2026-07-12 (dead code, zero references —
  superseded by the current structure-detection + narration approach). Add a
  short note after each bullet, e.g.:
  `  _(MemoryView was later removed — superseded by live structure detection in \`src/lib/visualizers/detect-live.ts\`.)_`
  and similarly for CallStackPanel → superseded by call-stack narration in
  `src/lib/explain/narrate.ts`.
- Commit message: `Note removed components in TASKS.md`

## Day 16 — 2026-07-28
**Tick two stale checkboxes in docs/ROADMAP.md**
- File: `docs/ROADMAP.md`
- Line 95: change
  `- [ ] 🔵 (Day 7–11) **JavaScript tracer** — AST instrumentation, dedicated Web Worker, mapped into \`ValueNode\``
  → `- [x] 🔵 (Day 7–11) **JavaScript tracer** — AST instrumentation, dedicated Web Worker, mapped into \`ValueNode\` — done 2026-07-12`
- Line 115: change
  `- [ ] 🔵 interview mode: solve a DSA problem → complexity + optimization tips, reusing Phase 8's detector — **scoped to Python first**; multi-language interview mode is a stretch goal past day 40`
  → `- [x] 🔵 interview mode: solve a DSA problem → complexity + optimization tips, reusing Phase 8's detector — shipped 2026-07-12 for **both Python and JavaScript** (ahead of the original Python-first plan)`
- Commit message: `Tick completed roadmap items`

## Day 17 — 2026-07-29
**README: add a Deploy section**
- File: `README.md`
- Add this new section at the end of the file (after the "Project structure"
  section from Day 6):
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

## Day 18 — 2026-07-30
**package.json: add repository/author/license metadata**
- File: `package.json`
- After the `"description"` line added on Day 2, add:
  ```json
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/V-vumika/RunX.git"
  },
  ```
- Commit message: `Add package.json repository metadata`

## Day 19 — 2026-07-31
**Accessibility: label the Timer's icon-only buttons**
- File: `src/components/interview/Timer.tsx`
- Line 35 area (the pause/resume button, currently has `title` but no
  `aria-label` — icon-only buttons need both, `title` alone isn't reliably
  announced by screen readers): add a new line right after the `title={...}`
  line:
  ```tsx
  aria-label={running ? "Pause timer" : "Resume timer"}
  ```
- Line 43 area (the reset button, currently `title="Reset timer"` only): add
  right after that line:
  ```tsx
  aria-label="Reset timer"
  ```
- Commit message: `Add aria-labels to Timer buttons`

## Day 20 — 2026-08-01
**README: add a badges row**
- File: `README.md`
- At line 1, right after the `# RunX` heading, add a new line:
  ```markdown
  ![Build](https://img.shields.io/github/actions/workflow/status/V-vumika/RunX/build.yml?branch=main) ![License](https://img.shields.io/badge/license-MIT-blue)
  ```
- Note: the build badge assumes a GitHub Actions workflow named `build.yml`
  exists — if you haven't set up CI yet, either skip the build badge (just
  keep the license one) or this is also a fine day to add a minimal
  `.github/workflows/build.yml` that runs `npm run build && npm test`.
- Commit message: `Add README badges`

---

## Day 21 — 2026-08-02
**Fix stale docs/ARCHITECTURE.md — JS tracer described as not existing**
- File: `docs/ARCHITECTURE.md`
- Lines 39–45 currently read (in the JS client bullet):
  ```
  - `javascript` → `js-client.ts` + `public/workers/js.worker.js` — executes via
    `AsyncFunction` inside a plain worker (never main-thread eval), captures
    console output + `prompt()`/`readline()` stdin, returns a `RunResult` with
    ONE synthetic `final` snapshot carrying stdout. No per-line tracer yet
    (Phase 9); Explain shows a Python-only notice meanwhile. Complexity DOES
    work for JS: `src/lib/explain/lang/` (per-language profiles) statically
    analyzes the source and the store fills `result.complexity` from it.
  ```
  Replace with:
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

## Day 22 — 2026-08-03
**Add .editorconfig**
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

## Day 23 — 2026-08-04
**Add .gitattributes**
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

## Day 24 — 2026-08-05
**package.json: pin the Node version and add keywords**
- File: `package.json`
- After the `"repository"` block added on Day 18, add:
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

## Day 25 — 2026-08-06
**Add CHANGELOG.md**
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

## Day 26 — 2026-08-07
**Add a GitHub bug report issue template**
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

## Day 27 — 2026-08-08
**Add a GitHub pull request template**
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

## Day 28 — 2026-08-09
**Add a minimal CI workflow**
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
- Why: this is also what the README badge added on Day 20 points at — if you
  skipped adding the workflow that day, this closes the loop.
- Commit message: `Add CI workflow`

## Day 29 — 2026-08-10
**Add SECURITY.md**
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

## Day 30 — 2026-08-11
**next.config.ts: drop the X-Powered-By header**
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
  small, harmless information disclosure, one line to turn off. (Verified
  `poweredByHeader` is a real, supported config key in this Next.js version.)
- Commit message: `Disable the X-Powered-By header`

---

## After day 30
By 2026-08-11 the repo will have: an accurate README + docs, LICENSE,
CONTRIBUTING, SECURITY.md, CHANGELOG, robots.txt/sitemap, GitHub issue/PR
templates, a CI workflow, editor/git hygiene files, a couple of real lint
fixes, and a small accessibility fix — all genuine, all safe, none of it
filler. If you're still between projects after this, the next real,
non-trivial work is listed in `CLAUDE.md`'s "Build plan" section (Java/C++
tracer, Supabase accounts, watch-variables) — those need actual design
decisions, not one-line fixes, so they don't belong in a streak list.
