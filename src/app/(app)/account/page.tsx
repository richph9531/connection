import Link from "next/link";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/profile";

export const metadata = { title: "Account · Connection" };

export default async function AccountPage() {
  const { profile } = await requireProfile();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Your account</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Your profile</h2>
          </CardTitle>
          <CardDescription>Other members only ever see your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Display name</dt>
            <dd className="break-words">{profile.display_name}</dd>
            <dt className="text-muted-foreground">Recovery started</dt>
            <dd>{profile.recovery_start_date}</dd>
            <dt className="text-muted-foreground">Time zone</dt>
            <dd className="break-words">{profile.timezone}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Your privacy</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <ul className="list-disc space-y-1 pl-5">
            <li>Your journal notes are visible only to you.</li>
            <li>An accountability partner sees only the check-ins you choose to share, never your notes.</li>
            <li>Your email address is used only to send login links and is never shown to anyone.</li>
            <li>No ads, no trackers, no analytics.</li>
          </ul>
          <Link href="/privacy" className="font-medium underline underline-offset-4">
            Read the full privacy page
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Download your data</h2>
          </CardTitle>
          <CardDescription>
            A copy of your profile, check-ins (including private notes), posts and comments as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/account/export" download className={buttonVariants({ size: "lg" })}>
            Download my data
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Delete your account</h2>
          </CardTitle>
          <CardDescription>
            Permanently removes your account and everything you have added. This can&apos;t be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
