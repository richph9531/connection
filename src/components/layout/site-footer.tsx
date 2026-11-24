import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t px-4 py-4 text-center text-sm text-muted-foreground">
      <Link href="/help" className="font-medium text-foreground underline underline-offset-4">
        Get help now
      </Link>
      <span className="mx-2">·</span>
      <Link href="/privacy" className="underline underline-offset-4">
        Privacy
      </Link>
    </footer>
  );
}
