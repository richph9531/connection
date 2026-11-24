export type HelpContact = {
  label: string;
  /** Digits (and leading +) used for tel:/sms: links. */
  phone?: string;
  sms?: string;
  url?: string;
};

export type HelpResource = {
  region: string;
  name: string;
  description: string;
  contacts: HelpContact[];
};

export const EMERGENCY_NUMBERS: { region: string; number: string }[] = [
  { region: "Most of Europe and many other countries", number: "112" },
  { region: "United States and Canada", number: "911" },
  { region: "United Kingdom", number: "999" },
  { region: "South Africa", number: "10111" },
  { region: "Australia", number: "000" },
];

export const CRISIS_RESOURCES: HelpResource[] = [
  {
    region: "United States",
    name: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support 24/7 for anyone in emotional distress.",
    contacts: [
      { label: "Call 988", phone: "988" },
      { label: "Text 988", sms: "988" },
      { label: "988lifeline.org", url: "https://988lifeline.org" },
    ],
  },
  {
    region: "Canada",
    name: "9-8-8 Suicide Crisis Helpline",
    description: "Call or text any time, day or night.",
    contacts: [
      { label: "Call 988", phone: "988" },
      { label: "Text 988", sms: "988" },
      { label: "988.ca", url: "https://988.ca" },
    ],
  },
  {
    region: "United Kingdom and Ireland",
    name: "Samaritans",
    description: "Someone to talk to 24/7, whatever you're going through.",
    contacts: [
      { label: "Call 116 123", phone: "116123" },
      { label: "samaritans.org", url: "https://www.samaritans.org" },
    ],
  },
  {
    region: "South Africa",
    name: "SADAG Suicide Crisis Helpline",
    description: "The South African Depression and Anxiety Group, available 24 hours.",
    contacts: [
      { label: "Call 0800 567 567", phone: "0800567567" },
      { label: "sadag.org", url: "https://www.sadag.org" },
    ],
  },
  {
    region: "Australia",
    name: "Lifeline",
    description: "24/7 crisis support and suicide prevention.",
    contacts: [
      { label: "Call 13 11 14", phone: "131114" },
      { label: "lifeline.org.au", url: "https://www.lifeline.org.au" },
    ],
  },
  {
    region: "Anywhere else",
    name: "Find A Helpline",
    description: "Free, confidential helplines in over 130 countries.",
    contacts: [{ label: "findahelpline.com", url: "https://findahelpline.com" }],
  },
];

export function telHref(number: string): string {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export function smsHref(number: string): string {
  return `sms:${number.replace(/[^\d+]/g, "")}`;
}
