import Link from "next/link";
import { ComposeForm } from "@/components/feed/compose-form";
import { PostCard } from "@/components/feed/post-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { feedHref, parsePage } from "@/lib/feed/pagination";
import { loadFeedPage } from "@/lib/feed/queries";
import { requireProfile } from "@/lib/profile";

export const metadata = { title: "Community · Connection" };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { supabase, user, profile } = await requireProfile();
  const page = parsePage((await searchParams).page);
  const feed = await loadFeedPage(supabase, user.id, page);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Community</h1>
        <p className="text-sm text-muted-foreground">
          Share progress and encourage each other. Every step counts.
        </p>
      </div>

      {page === 1 && (
        <Card size="sm">
          <CardContent>
            <ComposeForm />
          </CardContent>
        </Card>
      )}

      {feed.error && (
        <p role="alert" className="text-sm text-destructive">
          Some posts couldn&apos;t be loaded. Please refresh to try again.
        </p>
      )}

      {feed.posts.length === 0 && !feed.error ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {page === 1
            ? "No posts yet. Be the first to share how you're doing. Your story could help someone today."
            : "There are no older posts."}
        </p>
      ) : (
        <section aria-label="Posts" className="flex flex-col gap-3">
          {feed.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewerId={user.id}
              timeZone={profile.timezone}
            />
          ))}
        </section>
      )}

      {(page > 1 || feed.hasOlder) && (
        <nav
          aria-label="Feed pages"
          className="flex items-center justify-between gap-2"
        >
          {page > 1 ? (
            <Link
              href={feedHref(page - 1)}
              className={buttonVariants({ variant: "outline" })}
            >
              Newer posts
            </Link>
          ) : (
            <span />
          )}
          {feed.hasOlder && (
            <Link
              href={feedHref(page + 1)}
              className={buttonVariants({ variant: "outline" })}
            >
              Older posts
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
