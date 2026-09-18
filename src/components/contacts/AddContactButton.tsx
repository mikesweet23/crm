"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Select } from "@/components/ui/Field";
import { LEAD_SOURCES } from "@/lib/types";

export function AddContactButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      first_name: String(fd.get("first_name") || "").trim(),
      last_name: String(fd.get("last_name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      lead_source: String(fd.get("lead_source") || "").trim(),
    };

    startTransition(async () => {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save the contact.");
        return;
      }
      const id = data.contact?.id;
      setOpen(false);
      if (id) {
        router.push(`/contacts/${id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Add contact
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title="Add contact"
        description="Create a record manually. No marketing consent is assumed."
      >
        {error ? (
          <p className="mb-4 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <Input name="first_name" required autoComplete="given-name" />
            </Field>
            <Field label="Last name">
              <Input name="last_name" required autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" />
          </Field>
          <Field label="Telephone" hint="Add an email or telephone number.">
            <Input name="phone" type="tel" autoComplete="tel" />
          </Field>
          <Field label="Lead source">
            <Select name="lead_source" defaultValue="Referral">
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save contact"}
            </Button>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
