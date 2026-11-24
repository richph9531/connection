export const MOODS: Record<number, { face: string; label: string }> = {
  1: { face: "😞", label: "Very low" },
  2: { face: "🙁", label: "Low" },
  3: { face: "😐", label: "Okay" },
  4: { face: "🙂", label: "Good" },
  5: { face: "😄", label: "Great" },
};

export function moodFor(mood: number) {
  return MOODS[mood] ?? MOODS[3];
}

/** "late_night_phone" or "late-night phone" -> "Late-night phone". */
export function formatTrigger(trigger: string): string {
  const text = trigger.trim().replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Formats a YYYY-MM-DD date as e.g. "Mon 23 Nov" without shifting it by time zone. */
export function formatCheckInDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function cleanLabel(clean: boolean): string {
  return clean ? "Clean day" : "Tough day";
}
