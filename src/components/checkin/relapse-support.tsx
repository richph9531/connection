import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RelapseSupport({
  streakStartsToday,
  restartStreak,
}: {
  streakStartsToday: boolean;
  restartStreak: () => Promise<void>;
}) {
  return (
    <Card data-testid="relapse-support" className="bg-muted/40">
      <CardHeader>
        <CardTitle>
          <h2>Thank you for being honest</h2>
        </CardTitle>
        <CardDescription>
          A hard day doesn&apos;t erase the progress you&apos;ve made. Every day is a fresh start, and checking in
          today is a real step forward.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <p>
          It can help to reach out to your accountability partner or the community. If you need support right now,
          see{" "}
          <Link href="/help" className="font-medium underline underline-offset-4">
            Get help now
          </Link>
          .
        </p>
        {streakStartsToday ? (
          <p role="status" className="font-medium">
            Your new streak starts today. We&apos;re glad you&apos;re here.
          </p>
        ) : (
          <form action={restartStreak} className="flex flex-col gap-2">
            <p className="text-muted-foreground">
              If you like, you can start a fresh streak from today. Your longest streak so far is kept.
            </p>
            <Button type="submit" variant="outline" size="lg" className="h-11">
              Start a fresh streak from today
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
