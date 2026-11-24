import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CRISIS_RESOURCES, EMERGENCY_NUMBERS, smsHref, telHref, type HelpContact } from "@/lib/account/help-resources";

function ContactLink({ contact }: { contact: HelpContact }) {
  const href = contact.phone ? telHref(contact.phone) : contact.sms ? smsHref(contact.sms) : contact.url!;
  const external = !contact.phone && !contact.sms;
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
    >
      {contact.label}
    </a>
  );
}

export function EmergencyNumbers() {
  return (
    <ul className="grid gap-2 text-sm sm:grid-cols-2">
      {EMERGENCY_NUMBERS.map((entry) => (
        <li key={entry.region} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <span>{entry.region}</span>
          <a href={telHref(entry.number)} className="shrink-0 text-base font-semibold underline underline-offset-4">
            {entry.number}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CrisisResources() {
  return (
    <ul className="flex flex-col gap-3">
      {CRISIS_RESOURCES.map((resource) => (
        <li key={resource.name}>
          <Card size="sm">
            <CardHeader>
              <CardTitle>
                <h3>{resource.name}</h3>
              </CardTitle>
              <CardDescription>
                <span className="font-medium text-foreground">{resource.region}.</span> {resource.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {resource.contacts.map((contact) => (
                <ContactLink key={contact.label} contact={contact} />
              ))}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
