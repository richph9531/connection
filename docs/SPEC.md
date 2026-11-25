# Connection — Product Spec (MVP)

Connection is a private, invite-only web app for the 20–50 members of the STOP community.
Members check in daily and share progress in their recovery from porn addiction.
Language: English. Works well on phones (most members will use it on mobile).

## Principles
1. **Safety and privacy first.** Members use an anonymous display name. Real names and emails are never shown to other members.
2. **Private by default.** Check-ins and journal notes are private unless the member chooses to share.
3. **Encouraging, never shaming.** Use supportive wording, especially around relapse ("Every day is a fresh start").
4. **Simple.** A daily check-in takes under 60 seconds.

## Users and roles
| Role | Can do |
|---|---|
| Member | Check in, view own history and streak, post, comment, react, choose an accountability partner, export or delete own data |
| Moderator | Everything a member can do, plus remove posts and comments, review reports, create invites |
| Admin | Everything a moderator can do, plus change roles |

## Features
### F0. Accounts (invite-only)
- Sign up only with a valid invite code (single-use, expires after 14 days).
- Login with an email magic link (no passwords to remember or leak).
- On first login: choose a unique display name, set your recovery start date, and pick a timezone.

### F1. Daily check-in
- One check-in per day, editable that day. Fields:
  - Stayed clean today? (yes/no)
  - Mood (1–5 faces)
  - Urge level (0–10 slider)
  - Triggers (multi-select: stress, boredom, loneliness, tiredness, late-night phone, conflict, other)
  - Private journal note (optional, never shared)
  - Share this check-in with my accountability partner (default on, does not include the note)
- History list and per-day detail view.
- If "clean" is no, show a compassionate message and offer to reset the streak start date.

### F2. Streak and milestones
- Dashboard showing the current streak (days since recovery start), longest streak, and a calendar colored by check-in result.
- Milestones at 1, 7, 14, 30, 60, 90, 180, and 365 days. On reaching one, offer to share it to the community feed (optional).

### F3. Community feed
- Members write progress posts (text, max 2000 characters).
- Feed is newest first, paginated, visible to all logged-in members.
- Comments on posts.
- Encouragement reactions: ❤️ support, 💪 strength, 🙏 prayer, 👏 well done.
- Report a post or comment (goes to moderators).

### F4. Accountability partner
- Request a partner by display name. They accept or decline.
- Active partners see each other's shared check-ins (clean, mood, urge, triggers — never the journal note) and streak.
- Either partner can end the partnership at any time.

### F5. Moderation and admin
- Moderator page: list of open reports, remove or restore posts and comments, dismiss reports.
- Invites page: create invite codes, see used/unused/expired.
- Admin: change member roles.

### F6. Privacy, safety and account
- Export my data (JSON download of profile, check-ins, posts, comments).
- Delete my account and all data (with confirmation).
- "Get help now" page with crisis and support resources, linked from every page footer.
- Plain-language privacy page.
- No third-party analytics, ads, or trackers.

## Tech stack
- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase: Postgres, Auth (magic link), Row Level Security (RLS) on every table
- Hosting: Vercel (free tier). Database: Supabase (free tier).
- Tests: Vitest (unit), Playwright (end-to-end). CI: GitHub Actions (lint, typecheck, tests).

## Data model (created in the foundation ticket)
- `profiles` (id = auth user id, display_name unique, role, recovery_start_date, longest_streak, timezone, created_at)
- `invites` (code, created_by, used_by, used_at, expires_at)
- `check_ins` (id, user_id, date, clean, mood, urge_level, triggers[], note, share_with_partner; unique(user_id, date))
- `posts` (id, author_id, body, milestone_days nullable, created_at, removed_at, removed_by)
- `comments` (id, post_id, author_id, body, created_at, removed_at, removed_by)
- `reactions` (post_id, user_id, kind; primary key on all three)
- `partnerships` (id, requester_id, partner_id, status pending|active|declined|ended, created_at)
- `reports` (id, post_id or comment_id, reporter_id, reported_author_id, reason, status open|resolved|dismissed, created_at). Reports stay after the author deletes the content, and are removed when that author deletes their account. `created_at` is always set by the database.

## Out of scope for MVP
Direct messages, push notifications, file/image uploads, multiple languages, native mobile apps.
