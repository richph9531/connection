import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/checkin");

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold">Connection</h1>
      <p className="text-muted-foreground">
        A private space for the STOP community to check in daily and encourage each other. Every day is a
        fresh start.
      </p>
      <div className="flex w-full flex-col gap-3">
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Log in
        </Link>
        <Link href="/login?mode=join" className={buttonVariants({ size: "lg", variant: "outline" })}>
          I have an invite code
        </Link>
      </div>
    </main>
  );
}
