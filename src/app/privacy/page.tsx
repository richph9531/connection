import Link from "next/link";

export const metadata = { title: "Privacy · Connection" };

const VISIBILITY: { what: string; who: string }[] = [
  { what: "Your private journal notes", who: "Only you. Not your partner, not moderators, not other members." },
  { what: "Your email address", who: "Nobody else. It is only used to send you login links." },
  { what: "Your display name", who: "Signed-in members of Connection." },
  { what: "Posts, comments and reactions", who: "Signed-in members of Connection." },
  {
    what: "Check-ins you choose to share (clean day, mood, urge level, triggers)",
    who: "Your accountability partner, only while you are partners. Never the note.",
  },
  {
    what: "Recovery start date, longest streak and time zone",
    who: "You, your accountability partner and the community's moderators.",
  },
  { what: "Reports you make about a post or comment", who: "Moderators." },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Privacy</h1>
        <p>
          Connection is a private, invite-only space for the STOP community. Your recovery is personal, so we
          keep things simple: we collect as little as possible, we keep it private by default, and you stay in
          control.
        </p>
      </header>

      <section aria-labelledby="collect" className="flex flex-col gap-3">
        <h2 id="collect" className="text-lg font-semibold">
          What we store
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Your email address, so we can send you a login link. There are no passwords.</li>
          <li>The display name, recovery start date and time zone you chose when you joined.</li>
          <li>Your daily check-ins: clean day, mood, urge level, triggers and any private note.</li>
          <li>Posts, comments and reactions you add to the community feed.</li>
          <li>Accountability partnerships, invites and reports.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          We never ask for your real name. Please choose a display name that doesn&apos;t identify you.
        </p>
      </section>

      <section aria-labelledby="who" className="flex flex-col gap-3">
        <h2 id="who" className="text-lg font-semibold">
          Who can see what
        </h2>
        <dl className="flex flex-col divide-y rounded-xl border text-sm">
          {VISIBILITY.map((row) => (
            <div key={row.what} className="flex flex-col gap-1 p-3">
              <dt className="font-medium">{row.what}</dt>
              <dd className="text-muted-foreground">{row.who}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">
          These rules are enforced by the database itself, not just by the screens you see. People outside
          Connection can&apos;t see anything, and search engines are asked not to index the site.
        </p>
      </section>

      <section aria-labelledby="never" className="flex flex-col gap-3">
        <h2 id="never" className="text-lg font-semibold">
          What we never do
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>No ads, no third-party analytics and no trackers.</li>
          <li>We never sell or share your information.</li>
          <li>We never write your check-ins or notes into our logs.</li>
          <li>We only use the cookies needed to keep you logged in.</li>
        </ul>
      </section>

      <section aria-labelledby="where" className="flex flex-col gap-3">
        <h2 id="where" className="text-lg font-semibold">
          Where your data lives
        </h2>
        <p className="text-sm">
          Your data is stored in a Supabase database, and the app runs on Vercel. Like any website, the people
          who run Connection have technical access to the database so they can keep it working. They only use
          that access to look after the service.
        </p>
      </section>

      <section aria-labelledby="control" className="flex flex-col gap-3">
        <h2 id="control" className="text-lg font-semibold">
          You are in control
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Choose for each check-in whether your accountability partner can see it.</li>
          <li>
            Download everything we store about you as a file from your{" "}
            <Link href="/account" className="font-medium underline underline-offset-4">
              account page
            </Link>
            .
          </li>
          <li>
            Delete your account at any time from the same page. Your profile, check-ins, notes, posts,
            comments, reactions and partnerships are permanently removed straight away.
          </li>
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        Questions about your privacy? Ask one of the community&apos;s moderators. If you need support right
        now, visit{" "}
        <Link href="/help" className="font-medium text-foreground underline underline-offset-4">
          Get help now
        </Link>
        .
      </p>
    </main>
  );
}
