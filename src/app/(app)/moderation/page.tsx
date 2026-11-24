import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/layout/coming-soon";
import { requireProfile } from "@/lib/profile";

export default async function Page() {
  const { profile } = await requireProfile();
  if (profile.role === "member") notFound();
  return <ComingSoon title="Moderation" description="Reports, invites and member roles." />;
}
