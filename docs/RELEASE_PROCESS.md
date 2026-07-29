# Release process

RunX doesn't publish to npm (it's an app, not a library) — a "release" here
means tagging a deployable snapshot of `main`.

1. Make sure `main` is green: `npm run build` and `npm test` both pass (the
   `build` CI workflow checks this on every push).
2. Bump `"version"` in `package.json` (semver).
3. Add an entry to `CHANGELOG.md` under a new version heading, dated.
4. Commit both together (e.g. `chore: release vX.Y.Z`).
5. Tag it: `git tag vX.Y.Z && git push --tags`.
6. Vercel redeploys `main` automatically on push — no separate deploy step
   for the frontend. See the "Deploy" section in `README.md` for first-time
   setup (`NEXT_PUBLIC_SITE_URL`, etc.).

There's no backend/database to migrate yet — Python and JavaScript both run
entirely client-side. This process gets a step added once Java/C++ land
(see `docs/JAVA_CPP_SANDBOX_NOTES.md`) and their sandbox needs its own
deploy.
