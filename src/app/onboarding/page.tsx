import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, recovery_start_date")
    .eq("id", user.id)
    .single();
  if (profile?.display_name && profile.recovery_start_date) redirect("/checkin");

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Welcome to Connection</h1>
        <p className="text-sm text-muted-foreground">Two quick questions and you&apos;re in.</p>
      </div>
      <OnboardingForm today={new Date().toISOString().slice(0, 10)} />
    </main>
  );
}
