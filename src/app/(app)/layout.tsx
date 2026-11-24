import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/profile";
import { navItemsFor } from "@/lib/routes";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Link href="/checkin" className="text-lg font-semibold">
            Connection
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span data-testid="display-name">{profile.display_name}</span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
        <AppNav items={navItemsFor(profile.role)} />
      </header>
      <main>{children}</main>
    </div>
  );
}
