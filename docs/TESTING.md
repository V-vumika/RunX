# Testing

RunX uses [Vitest](https://vitest.dev) for Node-only unit tests of the pure
engine logic — the classifier, narrator, entry detection, and support-check
code. These don't touch Pyodide or a browser; they run against real source
strings and small synthetic `Snapshot` fixtures, so they're fast and catch
the heuristic regressions the project keeps hitting (e.g. a `search()`
method shadowing Trie detection, swap-detection string matches, entry-point
parsing edge cases).

## Running tests

```bash
npm test              # whole suite
npx vitest run <path>  # a single file
npx vitest             # watch mode
```

## Windows note

`vitest.config.ts` forces `poolOptions.threads.singleThread: true`. Vitest 4's
default worker-pool intermittently fails on Windows with a
`reading 'config'` error; running the whole suite in one thread is the only
configuration that hasn't flaked here. Expect a deprecation notice from
`poolOptions` — it still works.

## Coverage areas

Tests live alongside the code they cover (`*.test.ts`), under `src/lib/`.
Current areas: `support-check`, `entry/python`, `entry/javascript`, `narrate`,
`classify`, `detect-live`, `measure`, `js-tracer/instrument`, `js-worker`,
`share`. See `docs/HARDENING.md` for the phase that established this
corpus and why (Phase 1.3).
