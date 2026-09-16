import Link from "next/link";
import { Card, PageHeader, Badge } from "@/components/ui/Card";
import { listPipelineContacts } from "@/lib/data/crm";
import { STAGE_LABELS } from "@/lib/types";
import { displayPhone, fullName } from "@/lib/phone";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const contacts = await listPipelineContacts();

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Everyone Absolute Mind has spoken with — one record per person."
        actions={
          <Link
            href="/search"
            className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-strong"
          >
            Search
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
          <span>Name</span>
          <span>Phone / Email</span>
          <span>Source</span>
          <span>Enquired</span>
          <span>Stage</span>
        </div>
        <div className="divide-y divide-slate-100">
          {contacts.map((c) => (
            <Link
              key={c.id}
              href={`/contacts/${c.id}`}
              className="grid gap-2 px-4 py-3 transition hover:bg-brand-soft/30 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-3"
            >
              <div>
                <p className="font-medium text-ink">{fullName(c.first_name, c.last_name)}</p>
                {c.do_not_contact ? (
                  <span className="text-xs font-semibold text-danger">Do Not Contact</span>
                ) : null}
              </div>
              <p className="text-sm text-muted">
                {displayPhone(c.phone) || c.email || "—"}
              </p>
              <p className="text-sm text-muted">{c.lead_source || "—"}</p>
              <p className="text-sm text-muted">{formatDate(c.first_enquiry_at)}</p>
              <Badge tone={c.do_not_contact ? "danger" : "brand"}>
                {STAGE_LABELS[c.current_stage]}
              </Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
