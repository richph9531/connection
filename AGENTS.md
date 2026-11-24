# House rules for every agent working on Connection

- Read docs/SPEC.md and docs/TICKETS.md before starting. Only build your ticket.
- Privacy: never show real names or emails to other members; journal notes are visible only to their author; every table has RLS.
- No third-party analytics, trackers, or ads. Never log check-in content or notes.
- Tone: encouraging, never shaming.
- Stay inside your feature's folders. Don't edit another feature's files.
- Run `pnpm lint && pnpm typecheck && pnpm test` before opening a PR. Add tests for what you build.
- Never commit secrets. Use environment variables (.env.local, which is git-ignored).
