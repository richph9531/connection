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
  { region: "Police (South Africa)", number: "10111" },
  { region: "Ambulance (South Africa)", number: "10177" },
  { region: "Any emergency from a mobile phone (South Africa)", number: "112" },
];

export const CRISIS_RESOURCES: HelpResource[] = [
  {
    region: "South Africa",
    name: "SADAG Suicide Crisis Helpline",
    description: "The South African Depression and Anxiety Group, free and available 24 hours.",
    contacts: [
      { label: "Call 0800 567 567", phone: "0800567567" },
      { label: "sadag.org", url: "https://www.sadag.org" },
    ],
  },
  {
    region: "South Africa",
    name: "SADAG Substance Abuse Helpline",
    description: "Free, confidential support for addiction, 24 hours a day.",
    contacts: [{ label: "Call 0800 12 13 14", phone: "0800121314" }],
  },
  {
    region: "South Africa",
    name: "Lifeline South Africa",
    description: "Someone to talk to, day or night, whatever you're going through.",
    contacts: [
      { label: "Call 0861 322 322", phone: "0861322322" },
      { label: "lifelinesa.co.za", url: "https://lifelinesa.co.za" },
    ],
  },
  {
    region: "Outside South Africa",
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
