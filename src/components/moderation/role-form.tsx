"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { changeRole, type ActionState } from "@/app/(app)/moderation/actions";
import { MEMBER_ROLES, ROLE_LABELS, type MemberRole } from "@/lib/moderation/roles";

export function RoleForm({ memberId, displayName, role }: { memberId: string; displayName: string; role: MemberRole }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(changeRole, { status: "idle" });
  const [selected, setSelected] = useState<MemberRole>(role);
  const id = `role-${memberId}`;

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="memberId" value={memberId} />
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Role for {displayName}
        </label>
        <select
          id={id}
          name="role"
          value={selected}
          onChange={(event) => setSelected(event.target.value as MemberRole)}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs"
        >
          {MEMBER_ROLES.map((option) => (
            <option key={option} value={option}>
              {ROLE_LABELS[option]}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          size="lg"
          variant="outline"
          disabled={pending || selected === role}
          aria-label={`Save role for ${displayName}`}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {state.status !== "idle" && (
        <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
