# Supabase

Database / auth / storage client (later phase — not part of the Phase 1 MVP).

Planned:

- `client.ts` — browser client via `@supabase/supabase-js`.
- `server.ts` — server client for Route Handlers / Server Components.
- Auth: email/password + OAuth.
- Persisted: saved code snippets, shared traces, user progress.

Decision still open per project brief: `@supabase/supabase-js` directly for
simple CRUD vs. Prisma against the Supabase Postgres instance.
