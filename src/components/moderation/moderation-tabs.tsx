import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ModerationTab } from "@/lib/moderation/roles";

const LABELS: Record<ModerationTab, string> = { reports: "Reports", invites: "Invites", members: "Members" };

export function ModerationTabs({ tabs, current }: { tabs: ModerationTab[]; current: ModerationTab }) {
  return (
    <nav aria-label="Moderation sections" className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <Link
          key={tab}
          href={`/moderation?tab=${tab}`}
          aria-current={tab === current ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-2 text-center text-sm font-medium text-muted-foreground",
            tab === current && "bg-background text-foreground shadow-xs",
          )}
        >
          {LABELS[tab]}
        </Link>
      ))}
    </nav>
  );
}
