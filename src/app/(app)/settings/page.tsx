import { Card, PageHeader } from "@/components/ui/Card";
import { PIPELINE_STAGES, STAGE_LABELS, LEAD_SOURCES } from "@/lib/types";
import { isDemoMode } from "@/lib/data/crm";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="A small set of configuration for Absolute Mind CRM."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Pipeline</h2>
          <p className="mt-1 text-sm text-muted">
            Stages are locked to the agreed Absolute Mind workflow.
          </p>
          <ol className="mt-4 space-y-2">
            {PIPELINE_STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm text-ink">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-strong">
                  {i + 1}
                </span>
                {STAGE_LABELS[s]}
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Users</h2>
          <p className="mt-1 text-sm text-muted">Managed via Supabase Auth in production.</p>
          <ul className="mt-4 space-y-3">
            <li className="rounded-xl border border-slate-100 px-3 py-2.5">
              <p className="font-medium text-ink">Paula</p>
              <p className="text-sm text-muted">Owner · paula@absolutemind.co.uk</p>
            </li>
            <li className="rounded-xl border border-slate-100 px-3 py-2.5">
              <p className="font-medium text-ink">Mike</p>
              <p className="text-sm text-muted">Administrator · mike@absolutemind.co.uk</p>
            </li>
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Email</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Sender name</dt>
              <dd className="font-medium text-ink">Absolute Mind</dd>
            </div>
            <div>
              <dt className="text-muted">Sender address</dt>
              <dd className="font-medium text-ink">paula@absolutemind.co.uk</dd>
            </div>
            <div>
              <dt className="text-muted">Paula notify</dt>
              <dd className="font-medium text-ink">paula@paulasweet.co.uk</dd>
            </div>
            <div>
              <dt className="text-muted">Provider</dt>
              <dd className="font-medium text-ink">
                Resend ({process.env.RESEND_API_KEY ? "configured" : "not configured"})
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Google Calendar</h2>
          <p className="mt-1 text-sm text-muted">
            Google Calendar remains the primary diary. The CRM stores event IDs for appointments.
            Booking availability continues to be checked by booking.absolutemind.co.uk.
          </p>
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Connection status: pending — wire credentials after Vercel deployment.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Contact form</h2>
          <p className="mt-1 text-sm text-muted">Marketing consent wording (v1.0)</p>
          <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-ink">
            I&apos;d like to receive occasional emails from Absolute Mind about services, resources
            and updates.
          </p>
          <p className="mt-3 text-sm text-muted">
            Public form: <code className="text-ink">/enquiry</code>
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Lead sources</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {LEAD_SOURCES.map((s) => (
              <span
                key={s}
                className="rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-strong"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Mode: {isDemoMode() ? "Demo (in-memory sample data)" : "Supabase connected"}
          </p>
        </Card>
      </div>
    </div>
  );
}
