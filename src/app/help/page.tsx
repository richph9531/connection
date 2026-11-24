import Link from "next/link";
import { CrisisResources, EmergencyNumbers } from "@/components/account/crisis-resources";

export const metadata = { title: "Get help now · Connection" };

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      {deleted && (
        <section role="status" className="rounded-xl border bg-muted/50 p-4 text-sm">
          <h2 className="mb-1 text-base font-semibold">Your account has been deleted</h2>
          <p>
            Your profile, check-ins, notes, posts and comments have been permanently removed. Thank you for being
            part of the community. Whatever comes next, we hope you keep looking after yourself, and you are
            always welcome back with a new invite.
          </p>
        </section>
      )}

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Get help now</h1>
        <p>You don&apos;t have to go through this alone. Reaching out is a sign of strength.</p>
      </header>

      <section aria-labelledby="danger" className="flex flex-col gap-3 rounded-xl border-2 border-destructive/40 p-4">
        <h2 id="danger" className="text-lg font-semibold">
          If you are in danger right now
        </h2>
        <p className="text-sm">
          If you might hurt yourself or someone else, or you are not safe, call your local emergency number now.
        </p>
        <EmergencyNumbers />
      </section>

      <section aria-labelledby="crisis" className="flex flex-col gap-3">
        <h2 id="crisis" className="text-lg font-semibold">
          Talk to someone today
        </h2>
        <p className="text-sm text-muted-foreground">
          Free, confidential helplines with trained people who will listen without judgement.
        </p>
        <CrisisResources />
      </section>

      <section aria-labelledby="urge" className="flex flex-col gap-3">
        <h2 id="urge" className="text-lg font-semibold">
          If you are struggling with an urge
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Pause and change your surroundings: stand up, step outside, go somewhere with other people.</li>
          <li>Breathe slowly: in for four, hold for four, out for six. Repeat a few times.</li>
          <li>Reach out to your accountability partner, a friend or your STOP group. A short message is enough.</li>
          <li>Urges rise and fall like a wave. You can ride this one out.</li>
        </ul>
      </section>

      <section aria-labelledby="slip" className="flex flex-col gap-3">
        <h2 id="slip" className="text-lg font-semibold">
          If you have slipped
        </h2>
        <p className="text-sm">
          A slip doesn&apos;t erase your progress or define you. Be kind to yourself, be honest in your next
          check-in, and reach out to someone you trust. Every day is a fresh start.
        </p>
      </section>

      <section aria-labelledby="community" className="flex flex-col gap-3">
        <h2 id="community" className="text-lg font-semibold">
          Support inside Connection
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link href="/partner" className="font-medium underline underline-offset-4">
              Your accountability partner
            </Link>
          </li>
          <li>
            <Link href="/feed" className="font-medium underline underline-offset-4">
              The community feed
            </Link>
          </li>
          <li>
            <Link href="/checkin" className="font-medium underline underline-offset-4">
              Today&apos;s check-in
            </Link>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Connection is a peer-support space, not a medical or emergency service. Members and moderators are not
          counsellors. If you need professional help, please contact a doctor or one of the services above.
        </p>
      </section>
    </main>
  );
}
