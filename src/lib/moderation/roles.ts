export const MEMBER_ROLES = ["member", "moderator", "admin"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const ROLE_LABELS: Record<MemberRole, string> = {
  member: "Member",
  moderator: "Moderator",
  admin: "Admin",
};

export const MODERATION_TABS = ["reports", "invites", "members"] as const;
export type ModerationTab = (typeof MODERATION_TABS)[number];

export function isModerator(role: MemberRole): boolean {
  return role === "moderator" || role === "admin";
}

export function tabsFor(role: MemberRole): ModerationTab[] {
  return role === "admin" ? [...MODERATION_TABS] : ["reports", "invites"];
}

export function resolveTab(requested: string | string[] | undefined, role: MemberRole): ModerationTab {
  const tabs = tabsFor(role);
  return tabs.find((tab) => tab === requested) ?? "reports";
}

/** Admins change other members' roles; they never change their own, so a community can't lose its last admin by accident. */
export function canChangeRole(actor: { id: string; role: MemberRole }, targetId: string): boolean {
  return actor.role === "admin" && actor.id !== targetId;
}
