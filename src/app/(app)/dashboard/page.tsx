import Link from "next/link";
import { Card, PageHeader, Badge } from "@/components/ui/Card";
import { getDashboard } from "@/lib/data/crm";
import { STAGE_LABELS } from "@/lib/types";
import { formatAppointmentSlot, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const stats = await getDashboard();

  const cards = [
    {
      label: "New enquiries",
      value: stats.new_enquiries,
      href: "/pipeline?stage=new_enquiry",
      hint: "Waiting for attention",
    },
    {
      label: "Awaiting contact",
      value: stats.awaiting_contact,
      href: "/pipeline?filter=awaiting",
      hint: "New + Attempted",
    },
    {
      label: "Today's consultations",
      value: stats.todays_consultations,
      href: "#today",
      hint: "Appointments today",
    },
    {
      label: "Tomorrow's consultations",
      value: stats.tomorrows_consultations,
      href: "#tomorrow",
      hint: "Appointments tomorrow",
    },
    {
      label: "Current clients",
      value: stats.current_clients,
      href: "/pipeline?stage=client",
      hint: "At Client stage",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A calm overview of what needs attention today."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, i) => (
          <Link
            key={card.label}
            href={card.href}
            className="animate-fade-up group"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:border-brand group-hover:shadow-md">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{card.value}</p>
              <p className="mt-2 text-sm text-muted">{card.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6" id="today">
          <h2 className="text-lg font-semibold text-ink">Today&apos;s consultations</h2>
          <div className="mt-4 space-y-3">
            {stats.todays_appointments.length === 0 ? (
              <p className="text-sm text-muted">No consultations today.</p>
            ) : (
              stats.todays_appointments.map((a) => (
                <Link
                  key={a.id}
                  href={`/contacts/${a.contact_id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 transition hover:border-brand hover:bg-brand-soft/40"
                >
                  <div>
                    <p className="font-medium text-ink">{a.contact_name}</p>
                    <p className="text-sm text-muted">{a.appointment_type}</p>
                  </div>
                  <p className="text-sm font-medium text-brand-strong">
                    {formatAppointmentSlot(a.start_time)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6" id="tomorrow">
          <h2 className="text-lg font-semibold text-ink">Tomorrow&apos;s consultations</h2>
          <div className="mt-4 space-y-3">
            {stats.tomorrows_appointments.length === 0 ? (
              <p className="text-sm text-muted">No consultations tomorrow.</p>
            ) : (
              stats.tomorrows_appointments.map((a) => (
                <Link
                  key={a.id}
                  href={`/contacts/${a.contact_id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 transition hover:border-brand hover:bg-brand-soft/40"
                >
                  <div>
                    <p className="font-medium text-ink">{a.contact_name}</p>
                    <p className="text-sm text-muted">{a.appointment_type}</p>
                  </div>
                  <p className="text-sm font-medium text-brand-strong">
                    {formatAppointmentSlot(a.start_time)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Recent enquiries</h2>
          <Link href="/pipeline" className="text-sm font-medium text-brand hover:text-brand-strong">
            Open pipeline →
          </Link>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {stats.recent_enquiries.map((c) => (
            <Link
              key={c.id}
              href={`/contacts/${c.id}`}
              className="flex flex-col gap-2 py-3 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-2"
            >
              <div>
                <p className="font-medium text-ink">
                  {c.first_name} {c.last_name}
                </p>
                <p className="text-sm text-muted">
                  {formatDate(c.first_enquiry_at)} · {c.lead_source || "Unknown source"}
                </p>
              </div>
              <Badge tone="brand">{STAGE_LABELS[c.current_stage]}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
