import { notFound } from "next/navigation";
import { CreateInviteForm } from "@/components/moderation/create-invite-form";
import { InviteList } from "@/components/moderation/invite-list";
import { MemberRoles } from "@/components/moderation/member-roles";
import { ModerationTabs } from "@/components/moderation/moderation-tabs";
import { RemovedList } from "@/components/moderation/removed-list";
import { ReportList } from "@/components/moderation/report-list";
import { requireProfile } from "@/lib/profile";
import {
  loadInvites,
  loadMembers,
  loadOpenReports,
  loadRemovedContent,
} from "@/lib/moderation/queries";
import { isModerator, resolveTab, tabsFor } from "@/lib/moderation/roles";

export const metadata = { title: "Moderation · Connection" };

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { supabase, profile } = await requireProfile();
  if (!isModerator(profile.role)) notFound();
  const tab = resolveTab((await searchParams).tab, profile.role);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Moderation</h1>
        <p className="text-sm text-muted-foreground">Keep Connection a safe, kind place for everyone.</p>
      </div>
      <ModerationTabs tabs={tabsFor(profile.role)} current={tab} />

      {tab === "reports" && (
        <>
          <section aria-labelledby="reports-heading" className="flex flex-col gap-3">
            <h2 id="reports-heading" className="font-semibold">
              Reports to review
            </h2>
            <ReportList reports={await loadOpenReports(supabase)} timeZone={profile.timezone} />
          </section>
          <section aria-labelledby="removed-heading" className="flex flex-col gap-3">
            <div>
              <h2 id="removed-heading" className="font-semibold">
                Recently removed
              </h2>
              <p className="text-sm text-muted-foreground">Removed posts and comments are hidden from members. Restore anything removed by mistake.</p>
            </div>
            <RemovedList items={await loadRemovedContent(supabase)} timeZone={profile.timezone} />
          </section>
        </>
      )}

      {tab === "invites" && (
        <>
          <section aria-labelledby="new-invite-heading" className="flex flex-col gap-3">
            <h2 id="new-invite-heading" className="font-semibold">
              Invite someone
            </h2>
            <CreateInviteForm />
          </section>
          <section aria-labelledby="invites-heading" className="flex flex-col gap-3">
            <h2 id="invites-heading" className="font-semibold">
              Invite codes
            </h2>
            <InviteList invites={await loadInvites(supabase)} timeZone={profile.timezone} now={new Date()} />
          </section>
        </>
      )}

      {tab === "members" && (
        <section aria-labelledby="members-heading" className="flex flex-col gap-3">
          <div>
            <h2 id="members-heading" className="font-semibold">
              Member roles
            </h2>
            <p className="text-sm text-muted-foreground">
              Moderators review reports and create invites. Admins can also change roles.
            </p>
          </div>
          <MemberRoles members={await loadMembers(supabase)} currentUserId={profile.id} />
        </section>
      )}
    </div>
  );
}
