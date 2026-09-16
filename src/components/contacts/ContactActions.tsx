"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { PIPELINE_STAGES, STAGE_LABELS, type PipelineStage } from "@/lib/types";

type Modal =
  | null
  | "note"
  | "call"
  | "appointment"
  | "stage"
  | "not_proceeding"
  | "dnc";

export function ContactActions({
  contactId,
  currentStage,
  doNotContact,
}: {
  contactId: string;
  currentStage: PipelineStage;
  doNotContact: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setModal(null);
    setError(null);
  }

  function refresh() {
    router.refresh();
    close();
  }

  function submitActivity(type: "note" | "call", title: string, body: string) {
    startTransition(async () => {
      const res = await fetch(`/api/contacts/${contactId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_type: type, title, body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save");
        return;
      }
      refresh();
    });
  }

  function onNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    submitActivity("note", "Note", String(fd.get("body") || ""));
  }

  function onCall(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    submitActivity("call", "Call logged", String(fd.get("body") || ""));
  }

  function onStage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const stage = String(fd.get("stage")) as PipelineStage;
    startTransition(async () => {
      const res = await fetch(`/api/contacts/${contactId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) {
        setError("Could not change stage");
        return;
      }
      refresh();
    });
  }

  function onNotProceeding() {
    startTransition(async () => {
      const res = await fetch(`/api/contacts/${contactId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "not_proceeding" }),
      });
      if (!res.ok) {
        setError("Could not update");
        return;
      }
      refresh();
    });
  }

  function onDnc(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await fetch(`/api/contacts/${contactId}/do-not-contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: String(fd.get("reason") || "") }),
      });
      if (!res.ok) {
        setError("Could not mark Do Not Contact");
        return;
      }
      refresh();
    });
  }

  function onAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date"));
    const time = String(fd.get("time"));
    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    startTransition(async () => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: contactId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          appointment_type: String(fd.get("type") || "Consultation"),
          meeting_method: String(fd.get("method") || "telephone"),
          administrative_note: String(fd.get("note") || ""),
        }),
      });
      if (!res.ok) {
        setError("Could not create appointment");
        return;
      }
      refresh();
    });
  }

  const actions = [
    { key: "note" as const, label: "Add Note", variant: "primary" as const },
    { key: "call" as const, label: "Log Call", variant: "secondary" as const },
    {
      key: "appointment" as const,
      label: "Add Appointment",
      variant: "secondary" as const,
      disabled: doNotContact,
    },
    { key: "stage" as const, label: "Change Stage", variant: "soft" as const },
    {
      key: "not_proceeding" as const,
      label: "Mark Not Proceeding",
      variant: "ghost" as const,
    },
    {
      key: "dnc" as const,
      label: "Do Not Contact",
      variant: "danger" as const,
      disabled: doNotContact,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.key}
            type="button"
            variant={a.variant}
            disabled={a.disabled}
            onClick={() => {
              if (a.key === "not_proceeding") {
                setModal("not_proceeding");
              } else {
                setModal(a.key);
              }
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div className="animate-fade-up w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">
                {modal === "note" && "Add note"}
                {modal === "call" && "Log call"}
                {modal === "appointment" && "Add appointment"}
                {modal === "stage" && "Change stage"}
                {modal === "not_proceeding" && "Mark not proceeding"}
                {modal === "dnc" && "Do Not Contact"}
              </h2>
              <button type="button" onClick={close} className="text-sm text-muted hover:text-ink">
                Close
              </button>
            </div>

            {error ? (
              <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
            ) : null}

            {modal === "note" ? (
              <form onSubmit={onNote} className="space-y-4">
                <Field label="Note">
                  <Textarea name="body" required placeholder="Administrative note only…" />
                </Field>
                <Button type="submit" disabled={pending}>
                  Save note
                </Button>
              </form>
            ) : null}

            {modal === "call" ? (
              <form onSubmit={onCall} className="space-y-4">
                <Field label="Call summary">
                  <Textarea name="body" required placeholder="Spoke with… Consultation arranged…" />
                </Field>
                <Button type="submit" disabled={pending}>
                  Log call
                </Button>
              </form>
            ) : null}

            {modal === "stage" ? (
              <form onSubmit={onStage} className="space-y-4">
                <Field label="New stage">
                  <Select name="stage" defaultValue={currentStage}>
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit" disabled={pending}>
                  Update stage
                </Button>
              </form>
            ) : null}

            {modal === "not_proceeding" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  This marks the enquiry as not proceeding. They may contact Absolute Mind again.
                  This is different from Do Not Contact.
                </p>
                <div className="flex gap-2">
                  <Button type="button" onClick={onNotProceeding} disabled={pending}>
                    Confirm
                  </Button>
                  <Button type="button" variant="ghost" onClick={close}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {modal === "dnc" ? (
              <form onSubmit={onDnc} className="space-y-4">
                <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                  Do Not Contact means proactive contact must stop. This is never removed
                  automatically.
                </p>
                <Field label="Reason">
                  <Textarea
                    name="reason"
                    required
                    placeholder="Asked not to receive further contact."
                  />
                </Field>
                <Button type="submit" variant="danger" disabled={pending}>
                  Mark Do Not Contact
                </Button>
              </form>
            ) : null}

            {modal === "appointment" ? (
              <form onSubmit={onAppointment} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Date">
                    <Input name="date" type="date" required />
                  </Field>
                  <Field label="Time">
                    <Input name="time" type="time" required />
                  </Field>
                </div>
                <Field label="Type">
                  <Input name="type" defaultValue="Free consultation" />
                </Field>
                <Field label="Method">
                  <Select name="method" defaultValue="telephone">
                    <option value="telephone">Telephone</option>
                    <option value="online">Online</option>
                    <option value="in_person">In person</option>
                  </Select>
                </Field>
                <Field label="Admin note" hint="Optional">
                  <Textarea name="note" />
                </Field>
                <Button type="submit" disabled={pending}>
                  Book appointment
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
