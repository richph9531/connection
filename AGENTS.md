# House rules for every agent working on Connection

- Read docs/SPEC.md and docs/TICKETS.md before starting. Only build your ticket.
- Privacy: never show real names or emails to other members; journal notes are visible only to their author; every table has RLS.
- No third-party analytics, trackers, or ads. Never log check-in content or notes.
- Tone: encouraging, never shaming.
- Stay inside your feature's folders. Don't edit another feature's files.
- Run `pnpm lint && pnpm typecheck && pnpm test && pnpm db:test && pnpm test:e2e` before opening a PR. Add tests for what you build (unit + one Playwright happy path; pgTAP for any new RLS).
- Never commit secrets. Use environment variables (.env.local, which is git-ignored).

## Local setup
1. Node 22 + pnpm 9, Docker, Supabase CLI, `psql`.
2. `pnpm install`
3. `supabase start -x edge-runtime,realtime,storage-api,imgproxy,logflare,vector,studio,postgres-meta,supavisor`
4. `cp .env.example .env.local` and paste the `ANON_KEY` from `supabase status`.
5. `pnpm dev` → http://127.0.0.1:3000. Magic-link emails land in Mailpit at http://127.0.0.1:54324. Local invite codes: `LOCAL-INVITE-1..3` (see supabase/seed.sql).

## Where things live
- Database schema, RLS and helper functions: `supabase/migrations/`. Regenerate types with `pnpm db:types` after any migration.
- RLS tests: `supabase/tests/`. E2E tests: `e2e/` (use `joinAsNewMember` from `e2e/helpers.ts`).
- Supabase clients: `src/lib/supabase/{server,client}.ts`. Logged-in pages call `requireProfile()` from `src/lib/profile.ts`.
- Feature pages: `src/app/(app)/<feature>/`; feature components: `src/components/<feature>/`.
- Use `member_directory` (not `profiles`) to show other members' display names; use `partner_check_ins()` for partner data; moderation goes through `set_post_removed()` / `set_comment_removed()` / `set_member_role()`.
