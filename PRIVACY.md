# Privacy

RunX collects no personal data today:

- There is no backend, no database, and no analytics/tracking script
  anywhere in the app.
- Code you paste or type runs entirely in your browser (a Pyodide Web
  Worker for Python, a dedicated Web Worker for JavaScript) — it is never
  sent to a server.
- The "share" feature (`src/lib/share.ts`) packs your code, stdin, and
  language choice into the URL itself (`#s=…`) — the link is only ever
  as public as you choose to make it, and nothing is stored anywhere.

If accounts/persistent save are added later (see `CLAUDE.md`'s Phase 11,
not yet built), this file will be updated before that data collection
starts.
