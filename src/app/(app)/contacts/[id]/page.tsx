import { notFound } from "next/navigation";
import { Card, Badge, PageHeader } from "@/components/ui/Card";
import { ContactActions } from "@/components/contacts/ContactActions";
import { ContactEmail, ContactPhone } from "@/components/contacts/ContactChannels";
import { ImportantNoteEditor } from "@/components/contacts/ImportantNoteEditor";
import { getContact } from "@/lib/data/crm";
import { STAGE_LABELS } from "@/lib/types";
import { fullName } from "@/lib/phone";
import { formatAppointmentSlot, formatDate, formatShortDateTime } from "@/lib/utils";
import type { ReactNode } from "react";

export async function generateMetadata(props: PageProps<"/contacts/[id]">) {
  const { id } = await props.params;
  const contact = await getContact(id);
  if (!contact) return { title: "Contact" };
  return { title: fullName(contact.first_name, contact.last_name) };
}

export default async function ContactPage(props: PageProps<"/contacts/[id]">) {
  const { id } = await props.params;
  const contact = await getContact(id);
  if (!contact) notFound();

  const details: { label: string; value: ReactNode }[] = [
    {
      label: "Telephone",
      value: contact.phone ? (
        <ContactPhone contactId={contact.id} phone={contact.phone} />
      ) : (
        "—"
      ),
    },
    {
      label: "Email",
      value: contact.email ? (
        <ContactEmail contactId={contact.id} email={contact.email} />
      ) : (
        "—"
      ),
    },
    {
      label: "Preferred contact",
      value: contact.preferred_contact_method
        ? contact.preferred_contact_method.charAt(0).toUpperCase() +
          contact.preferred_contact_method.slice(1)
        : "—",
    },
    { label: "Pipeline stage", value: STAGE_LABELS[contact.current_stage] },
    { label: "Lead source", value: contact.lead_source || "—" },
    { label: "First enquiry", value: formatDate(contact.first_enquiry_at) },
    { label: "Last activity", value: formatShortDateTime(contact.last_activity_at) },
    {
      label: "Next appointment",
      value: contact.next_appointment
        ? formatAppointmentSlot(contact.next_appointment.start_time)
        : "—",
    },
    {
      label: "Marketing",
      value: contact.marketing_email ? "Email consent granted" : "No email marketing",
    },
  ];

  return (
    <div>
      <PageHeader
        title={fullName(contact.first_name, contact.last_name)}
        description="Contact details, important note, and complete activity timeline."
      />

      {contact.do_not_contact ? (
        <div className="mb-5 animate-fade-up rounded-2xl border border-red-200 bg-danger-soft px-4 py-4 sm:px-5">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-danger">
            Do Not Contact
          </p>
          <p className="mt-1 text-sm text-danger">
            Requested {formatDate(contact.do_not_contact_date)}
            {contact.do_not_contact_reason ? ` — “${contact.do_not_contact_reason}”` : ""}
          </p>
          <p className="mt-2 text-sm text-red-800/80">
            Proactive communication should not be used. Inbound enquiries are still recorded for
            review.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              Contact information
            </h2>
            <dl className="mt-4 space-y-3">
              {details.map((d) => (
                <div key={d.label}>
                  <dt className="text-xs font-medium text-muted">{d.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink">{d.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="brand">{STAGE_LABELS[contact.current_stage]}</Badge>
              {contact.marketing_email ? <Badge tone="success">Marketing</Badge> : null}
              {contact.do_not_contact ? <Badge tone="danger">DNC</Badge> : null}
            </div>
          </Card>

          <Card className="p-5">
            <ImportantNoteEditor
              contactId={contact.id}
              initial={contact.important_note ?? ""}
            />
          </Card>

          {(contact.enquiries?.length ?? 0) > 0 ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Enquiries
              </h2>
              <div className="mt-3 space-y-3">
                {contact.enquiries!.map((e) => (
                  <div key={e.id} className="rounded-xl border border-slate-100 px-3 py-2.5">
                    <p className="text-sm font-medium text-ink">
                      {e.help_category || "Enquiry"} · {formatDate(e.created_at)}
                    </p>
                    <p className="mt-1 text-sm text-muted line-clamp-3">{e.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <ContactActions
              contactId={contact.id}
              currentStage={contact.current_stage}
              doNotContact={contact.do_not_contact}
            />
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Activity timeline</h2>
            <p className="mt-1 text-sm text-muted">Newest first — everything important appears here.</p>
            <ol className="mt-5 space-y-4">
              {(contact.activities ?? []).length === 0 ? (
                <li className="text-sm text-muted">No activity yet.</li>
              ) : (
                contact.activities!.map((a) => (
                  <li
                    key={a.id}
                    className="animate-fade-up relative border-l-2 border-brand-soft pl-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {formatShortDateTime(a.created_at)}
                    </p>
                    <p className="mt-1 font-medium text-ink">{a.title}</p>
                    {a.body ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{a.body}</p>
                    ) : null}
                    {a.created_by_name ? (
                      <p className="mt-1 text-xs text-muted">
                        {a.automatic ? "Automatic" : `By ${a.created_by_name}`}
                      </p>
                    ) : null}
                  </li>
                ))
              )}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
