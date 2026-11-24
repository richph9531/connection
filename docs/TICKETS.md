# Connection — Build Tickets

Order: T0 must finish first (one agent). T1–T6 then run in parallel, one agent each, each in its own folder. T7 runs last.

| # | Ticket | Depends on | Agent |
|---|---|---|---|
| T0 | Foundation: project setup, full DB schema + RLS, invite-only magic-link auth, onboarding, layout/nav with stub pages for every feature, CI, Vercel deploy | — | 1 (sequential) |
| T1 | Daily check-in (F1) | T0 | parallel |
| T2 | Streak dashboard, calendar and milestones (F2) | T0 | parallel |
| T3 | Community feed: posts, comments, reactions, report button (F3) | T0 | parallel |
| T4 | Accountability partner (F4) | T0 | parallel |
| T5 | Moderation, invites and admin roles (F5) | T0 | parallel |
| T6 | Privacy: data export, account deletion, help page, privacy page (F6) | T0 | parallel |
| T7 | Final pass: RLS security audit, accessibility, mobile polish, end-to-end test of the full member journey | T1–T6 | 1 |

## Rules that keep parallel agents from colliding
- T0 creates **all** tables, migrations, shared types, and nav links up front. Feature tickets do not add migrations unless unavoidable, and if they do, they use a timestamped file named after the ticket.
- Each feature lives in its own route folder (`app/(app)/checkin`, `streak`, `feed`, `partner`, `moderation`, `account`) and its own `components/<feature>/` folder.
- Every ticket ships with tests (unit + one Playwright happy path) and passes CI before its PR is opened.

## Acceptance criteria (every ticket)
- Meets the feature section in SPEC.md.
- RLS prevents members from reading or writing other members' private data (tested).
- Works on a 375px-wide phone screen.
- Wording follows the "encouraging, never shaming" principle.
