export const PUBLIC_PATHS = ["/", "/login", "/help", "/privacy"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/auth/");
}

export type NavItem = { href: string; label: string; moderatorOnly?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { href: "/checkin", label: "Check in" },
  { href: "/streak", label: "Progress" },
  { href: "/feed", label: "Community" },
  { href: "/partner", label: "Partner" },
  { href: "/account", label: "Account" },
  { href: "/moderation", label: "Moderation", moderatorOnly: true },
];

export function navItemsFor(role: "member" | "moderator" | "admin"): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.moderatorOnly || role !== "member");
}
