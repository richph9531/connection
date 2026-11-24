import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/moderation/roles";
import type { MemberItem } from "@/lib/moderation/queries";
import { RoleForm } from "./role-form";

export function MemberRoles({ members, currentUserId }: { members: MemberItem[]; currentUserId: string }) {
  return (
    <ul className="flex flex-col divide-y rounded-lg border" aria-label="Members">
      {members.map((member) => (
        <li
          key={member.id}
          className="flex flex-wrap items-center justify-between gap-2 p-3"
          data-testid="member-row"
          data-name={member.displayName}
        >
          <span className="min-w-0 break-words font-medium">{member.displayName}</span>
          {member.id === currentUserId ? (
            <Badge variant="secondary">{ROLE_LABELS[member.role]} (you)</Badge>
          ) : (
            <RoleForm memberId={member.id} displayName={member.displayName} role={member.role} />
          )}
        </li>
      ))}
    </ul>
  );
}
