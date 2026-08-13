version: 1.0
timezone: Asia/Kolkata

accounts:
  shiv:
    username: Shiv-Reddy
    email: shivkumarreddy043@gmail.com
  vumi:
    username: V-vumika
    email: vumikabiswas40@gmail.com

commits:
  - date: 2026-07-13
    time: "15:10"
    account: vumi
    branch: main
    files:
      - README.md
    commit_message: |
      docs: rewrite README for v1.0
    push: true
  - date: 2026-07-13
    time: "15:13"
    account: vumi
    branch: main
    files:
      - package.json
      - package-lock.json
    commit_message: |
      chore: prune unused deps, add npm metadata
    push: true
  - date: 2026-07-14
    time: "08:47"
    account: vumi
    branch: main
    files:
      - src/app/globals.css
    commit_message: |
      chore: remove dead CSS
    push: true
  - date: 2026-07-14
    time: "17:45"
    account: vumi
    branch: main
    files:
      - docs/ROADMAP.md
    commit_message: |
      docs: tick completed items, fix stale Phase 3/7 notes
    push: true
  - date: 2026-07-15
    time: "10:35"
    account: vumi
    branch: main
    files:
      - src/components/execution/ExecutionControls.tsx
    commit_message: |
      fix: wire missing Space shortcut, add aria-labels
    push: true
  - date: 2026-07-15
    time: "15:30"
    account: vumi
    branch: main
    files:
      - src/components/visualizers/LinkedListViz.tsx
    commit_message: |
      style: canonical Tailwind spacing classes in LinkedListViz
    push: true
  - date: 2026-07-16
    time: "09:58"
    account: vumi
    branch: main
    files:
      - public/workers/js.worker.js
    commit_message: |
      fix: remove unused catch bindings in js.worker.js
    push: true
  - date: 2026-07-16
    time: "18:12"
    account: vumi
    branch: main
    files:
      - public/workers/pyodide.worker.js
    commit_message: |
      chore: remove unused eslint-disable comments in pyodide.worker.js
    push: true
  - date: 2026-07-17
    time: "11:20"
    account: vumi
    branch: main
    files:
      - src/components/landing/Hero.tsx
    commit_message: |
      style: canonical Tailwind classes in Hero
    push: true
  - date: 2026-07-17
    time: "11:25"
    account: vumi
    branch: main
    files:
      - docs/ARCHITECTURE.md
    commit_message: |
      docs: fix stale JS-tracer and store sections
    push: true
  - date: 2026-07-18
    time: "08:50"
    account: vumi
    branch: main
    files:
      - docs/ROADMAP-NEXT.md
    commit_message: |
      docs: fix stale MemoryView/aliasing note
    push: true
  - date: 2026-07-18
    time: "08:55"
    account: vumi
    branch: main
    files:
      - docs/TASKS.md
    commit_message: |
      docs: note removed components in TASKS.md
    push: true
  - date: 2026-07-19
    time: "10:03"
    account: vumi
    branch: main
    files:
      - src/components/ui/tabs.tsx
    commit_message: |
      style: canonical padding class in Tabs
    push: true
  - date: 2026-07-19
    time: "10:07"
    account: vumi
    branch: main
    files:
      - src/components/landing/authkit/HeroBackdrop.tsx
    commit_message: |
      style: canonical width class in HeroBackdrop
    push: true
  - date: 2026-07-20
    time: "09:41"
    account: shiv
    branch: main
    files:
      - src/components/interview/Timer.tsx
    commit_message: |
      fix: add aria-labels to Timer buttons
    push: true
  - date: 2026-07-20
    time: "09:46"
    account: vumi
    branch: main
    files:
      - next.config.ts
    commit_message: |
      fix: disable X-Powered-By header
    push: true
  - date: 2026-07-21
    time: "04:47"
    account: shiv
    branch: main
    files:
      - src/lib/execution/js-tracer/instrument.test.ts
    commit_message: |
      chore: remove unused eslint-disable in instrument.test.ts
    push: true
  - date: 2026-07-21
    time: "04:53"
    account: vumi
    branch: main
    files:
      - CLAUDE.md
    commit_message: |
      docs: update CLAUDE.md stack description
    push: true
  - date: 2026-07-22
    time: "10:18"
    account: shiv
    branch: main
    files:
      - components.json
    commit_message: |
      chore: fix indentation in components.json
    push: true
  - date: 2026-07-22
    time: "10:20"
    account: vumi
    branch: main
    files:
      - LICENSE
    commit_message: |
      chore: add LICENSE
    push: true
  - date: 2026-07-23
    time: "03:25"
    account: shiv
    branch: main
    files:
      - CONTRIBUTING.md
    commit_message: |
      docs: add CONTRIBUTING guide
    push: true
  - date: 2026-07-23
    time: "03:28"
    account: vumi
    branch: main
    files:
      - src/app/robots.ts
    commit_message: |
      feat: add robots.txt route
    push: true
  - date: 2026-07-24
    time: "12:05"
    account: shiv
    branch: main
    files:
      - src/app/sitemap.ts
    commit_message: |
      feat: add sitemap route
    push: true
  - date: 2026-07-24
    time: "12:15"
    account: vumi
    branch: main
    files:
      - .env.example
      - .gitignore
    commit_message: |
      chore: add .env.example
    push: true
  - date: 2026-07-25
    time: "08:39"
    account: shiv
    branch: main
    files:
      - .editorconfig
    commit_message: |
      chore: add .editorconfig
    push: true
  - date: 2026-07-25
    time: "08:45"
    account: vumi
    branch: main
    files:
      - .gitattributes
    commit_message: |
      chore: add .gitattributes
    push: true
  - date: 2026-07-26
    time: "00:52"
    account: shiv
    branch: main
    files:
      - CHANGELOG.md
    commit_message: |
      docs: add CHANGELOG for 1.0.0
    push: true
  - date: 2026-07-26
    time: "00:57"
    account: vumi
    branch: main
    files:
      - .github/ISSUE_TEMPLATE/bug_report.md
    commit_message: |
      chore: add bug report issue template
    push: true
  - date: 2026-07-27
    time: "09:14"
    account: shiv
    branch: main
    files:
      - .github/PULL_REQUEST_TEMPLATE.md
    commit_message: |
      chore: add pull request template
    push: true
  - date: 2026-07-27
    time: "09:25"
    account: vumi
    branch: main
    files:
      - .github/workflows/build.yml
    commit_message: |
      ci: add build workflow
    push: true
  - date: 2026-07-28
    time: "01:33"
    account: shiv
    branch: main
    files:
      - SECURITY.md
    commit_message: |
      docs: add SECURITY.md
    push: true
  - date: 2026-07-28
    time: "01:36"
    account: vumi
    branch: main
    files:
      - .github/workflows/dependency-review.yml
    commit_message: |
      ci: add dependency review workflow
    push: true
  - date: 2026-07-29
    time: "10:27"
    account: shiv
    branch: main
    files:
      - docs/ACCESSIBILITY.md
    commit_message: |
      docs: add ACCESSIBILITY.md
    push: true
  - date: 2026-07-29
    time: "10:42"
    account: vumi
    branch: main
    files:
      - docs/RELEASE_PROCESS.md
    commit_message: |
      docs: add RELEASE_PROCESS.md
    push: true
  - date: 2026-07-30
    time: "09:06"
    account: shiv
    branch: main
    files:
      - src/app/manifest.ts
    commit_message: |
      feat: add web app manifest
    push: true
  - date: 2026-07-30
    time: "09:28"
    account: vumi
    branch: main
    files:
      - src/app/layout.tsx
    commit_message: |
      feat: link web app manifest in layout metadata
    push: true
  - date: 2026-07-31
    time: "02:22"
    account: shiv
    branch: main
    files:
      - docs/HARDENING.md
    commit_message: |
      docs: fix stale test-config description in HARDENING.md
    push: true
  - date: 2026-07-31
    time: "02:28"
    account: vumi
    branch: main
    files:
      - .nvmrc
    commit_message: |
      chore: add .nvmrc
    push: true
  - date: 2026-08-01
    time: "08:58"
    account: shiv
    branch: main
    files:
      - .github/ISSUE_TEMPLATE/feature_request.md
    commit_message: |
      chore: add feature request issue template
    push: true
  - date: 2026-08-01
    time: "09:10"
    account: vumi
    branch: main
    files:
      - .github/ISSUE_TEMPLATE/config.yml
    commit_message: |
      chore: add issue template chooser config
    push: true
  - date: 2026-08-02
    time: "11:09"
    account: shiv
    branch: main
    files:
      - .github/dependabot.yml
    commit_message: |
      ci: add dependabot config
    push: true
  - date: 2026-08-02
    time: "11:20"
    account: vumi
    branch: main
    files:
      - .github/CODEOWNERS
    commit_message: |
      chore: add CODEOWNERS
    push: true
  - date: 2026-08-03
    time: "10:29"
    account: shiv
    branch: main
    files:
      - CODE_OF_CONDUCT.md
    commit_message: |
      docs: add CODE_OF_CONDUCT
    push: true
  - date: 2026-08-03
    time: "10:33"
    account: vumi
    branch: main
    files:
      - SUPPORT.md
    commit_message: |
      docs: add SUPPORT.md
    push: true
  - date: 2026-08-04
    time: "09:37"
    account:shiv
    branch: main
    files:
      - docs/TESTING.md
    commit_message: |
      docs: add TESTING.md
    push: true
  - date: 2026-08-04
    time: "09:44"
    account: vumi
    branch: main
    files:
      - .vscode/extensions.json
    commit_message: |
      chore: add recommended VS Code extensions
    push: true
  - date: 2026-08-05
    time: "06:44"
    account: shiv
    branch: main
    files:
      - .vscode/settings.json
    commit_message: |
      chore: add recommended workspace settings
    push: true
  - date: 2026-08-05
    time: "06:46"
    account: vumi
    branch: main
    files:
      - .github/workflows/codeql.yml
    commit_message: |
      ci: add CodeQL analysis workflow
    push: true
  - date: 2026-08-06
    time: "08:44"
    account: shiv
    branch: main
    files:
      - THIRD_PARTY_NOTICES.md
    commit_message: |
      docs: add THIRD_PARTY_NOTICES
    push: true
  - date: 2026-08-06
    time: "08:54"
    account: vumi
    branch: main
    files:
      - PRIVACY.md
    commit_message: |
      docs: add PRIVACY.md
    push: true
  - date: 2026-08-07
    time: "10:11"
    account: shiv
    branch: main
    files:
      - public/.well-known/security.txt
    commit_message: |
      chore: add security.txt
    push: true
  - date: 2026-08-07
    time: "10:15"
    account: vumi
    branch: main
    files:
      - .markdownlint.json
    commit_message: |
      chore: add markdownlint config
    push: true
  - date: 2026-08-08
    time: "09:52"
    account: shiv
    branch: main
    files:
      - docs/BROWSER_SUPPORT.md
    commit_message: |
      docs: add BROWSER_SUPPORT.md
    push: true
  - date: 2026-08-08
    time: "09:55"
    account: vumi
    branch: main
    files:
      - docs/KEYBOARD_SHORTCUTS.md
    commit_message: |
      docs: add KEYBOARD_SHORTCUTS.md
    push: true
  - date: 2026-08-09
    time: "05:58"
    account: shiv
    branch: main
    files:
      - docs/COMPLEXITY.md
    commit_message: |
      docs: add COMPLEXITY.md
    push: true
  - date: 2026-08-09
    time: "05:59"
    account: vumi
    branch: main
    files:
      - docs/VISUALIZERS.md
    commit_message: |
      docs: add VISUALIZERS.md catalog
    push: true
  - date: 2026-08-10
    time: "02:40"
    account: shiv
    branch: main
    files:
      - AUTHORS.md
    commit_message: |
      docs: add AUTHORS.md
    push: true
  - date: 2026-08-10
    time: "02:43"
    account: vumi
    branch: main
    files:
      - docs/JAVA_CPP_SANDBOX_NOTES.md
    commit_message: |
      docs: add JAVA_CPP_SANDBOX_NOTES.md
    push: true
  - date: 2026-08-11
    time: "00:20"
    account: shiv
    branch: main
    files:
      - docs/SHARE_LINKS.md
    commit_message: |
      docs: add SHARE_LINKS.md
    push: true
  - date: 2026-08-11
    time: "00:28"
    account: vumi
    branch: main
    files:
      - docs/INTERVIEW_MODE.md
    commit_message: |
      docs: add INTERVIEW_MODE.md
    push: true
