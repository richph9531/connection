export const TRIGGERS = [
  { value: "stress", label: "Stress" },
  { value: "boredom", label: "Boredom" },
  { value: "loneliness", label: "Loneliness" },
  { value: "tiredness", label: "Tiredness" },
  { value: "late_night_phone", label: "Late-night phone" },
  { value: "conflict", label: "Conflict" },
  { value: "other", label: "Other" },
] as const;

export type Trigger = (typeof TRIGGERS)[number]["value"];

export const TRIGGER_VALUES = TRIGGERS.map((trigger) => trigger.value) as [Trigger, ...Trigger[]];

export const MOODS = [
  { value: 1, face: "😞", label: "Very low" },
  { value: 2, face: "🙁", label: "Low" },
  { value: 3, face: "😐", label: "Okay" },
  { value: 4, face: "🙂", label: "Good" },
  { value: 5, face: "😄", label: "Great" },
] as const;

export function moodFor(value: number) {
  return MOODS.find((mood) => mood.value === value);
}

export function triggerLabel(value: string): string {
  return TRIGGERS.find((trigger) => trigger.value === value)?.label ?? value;
}

export const NOTE_MAX_LENGTH = 5000;
