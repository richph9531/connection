import { Badge } from "@/components/ui/badge";
import { moodFor, triggerLabel } from "@/lib/checkin/options";

export function CleanBadge({ clean }: { clean: boolean }) {
  return clean ? <Badge>Clean</Badge> : <Badge variant="secondary">Hard day</Badge>;
}

export function MoodFace({ mood }: { mood: number }) {
  const info = moodFor(mood);
  if (!info) return null;
  return (
    <span role="img" aria-label={`Mood: ${info.label}`} title={info.label} className="text-xl leading-none">
      {info.face}
    </span>
  );
}

export function TriggerList({ triggers }: { triggers: string[] }) {
  if (!triggers.length) return <span className="text-muted-foreground">None</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {triggers.map((trigger) => (
        <li key={trigger}>
          <Badge variant="outline">{triggerLabel(trigger)}</Badge>
        </li>
      ))}
    </ul>
  );
}
