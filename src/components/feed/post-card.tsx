import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPostTime, milestoneLabel } from "@/lib/feed/format";
import type { FeedPost } from "@/lib/feed/queries";
import { CommentSection } from "./comment-section";
import { DeleteButton } from "./delete-button";
import { ReactionBar } from "./reaction-bar";
import { ReportButton } from "./report-form";

export function PostCard({
  post,
  viewerId,
  timeZone,
}: {
  post: FeedPost;
  viewerId: string;
  timeZone: string;
}) {
  const mine = post.authorId === viewerId;
  return (
    <article aria-label={`Post by ${post.authorName}`} data-testid="post">
      <Card size="sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{post.authorName}</span>
            <time
              dateTime={post.createdAt}
              className="text-xs text-muted-foreground"
            >
              {formatPostTime(post.createdAt, timeZone)}
            </time>
            {post.milestoneDays !== null && (
              <Badge variant="secondary">
                <span aria-hidden="true">🎉</span>{" "}
                {milestoneLabel(post.milestoneDays)}
              </Badge>
            )}
          </div>
          {post.removed && (
            <p className="text-xs text-muted-foreground">
              A moderator hid this post from the community. Only you can see it.
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm break-words whitespace-pre-wrap">{post.body}</p>
          <ReactionBar
            postId={post.id}
            reactions={post.reactions}
            disabled={post.removed}
          />
          <CommentSection
            postId={post.id}
            canReply={!post.removed}
            comments={post.comments.map((comment) => ({
              id: comment.id,
              authorName: comment.authorName,
              body: comment.body,
              time: formatPostTime(comment.createdAt, timeZone),
              mine: comment.authorId === viewerId,
              removed: comment.removed,
            }))}
          />
          <div className="flex flex-wrap items-center gap-1 border-t pt-2">
            {mine ? (
              <DeleteButton target="post" targetId={post.id} />
            ) : (
              <ReportButton target="post" targetId={post.id} />
            )}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
