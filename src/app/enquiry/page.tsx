"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { HELP_CATEGORIES, LEAD_SOURCES } from "@/lib/types";

export default function EnquiryPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    // Honeypot
    if (String(fd.get("company") || "")) {
      setDone(true);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: fd.get("first_name"),
          last_name: fd.get("last_name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          preferred_contact_method: fd.get("preferred_contact_method"),
          help_category: fd.get("help_category"),
          message: fd.get("message"),
          lead_source: fd.get("lead_source") || "Website",
          marketing_email: fd.get("marketing_email") === "on",
          privacy: fd.get("privacy") === "on",
          turnstile_token: fd.get("cf-turnstile-response") || "demo",
          landing_page: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to send enquiry");
        return;
      }
      setDone(true);
      form.reset();
    });
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3">
          <Link href="https://absolutemind.co.uk">
            <Image
              src="/absolute-mind-logo.png"
              alt="Absolute Mind"
              width={150}
              height={84}
              className="h-11 w-auto"
              priority
            />
          </Link>
          <a href="tel:+447713385007" className="text-sm font-medium text-slate-500 hover:text-brand">
            07713 385007
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
        <section className="animate-fade-up text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Get in touch
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            Send a brief enquiry and Paula will respond. Please avoid detailed medical or highly
            sensitive information in this form.
          </p>
        </section>

        {done ? (
          <div className="mt-10 animate-fade-up rounded-2xl border border-emerald-200 bg-success-soft p-8 text-center">
            <p className="text-lg font-semibold text-success">Thank you</p>
            <p className="mt-2 text-sm text-emerald-800">
              Your enquiry has been received. Paula will be in touch soon.
            </p>
            <button
              type="button"
              className="mt-6 text-sm font-medium text-brand"
              onClick={() => setDone(false)}
            >
              Send another enquiry
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-10 animate-fade-up space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-8"
          >
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-10000px] h-px w-px overflow-hidden"
              aria-hidden
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input name="first_name" required />
              </Field>
              <Field label="Last name">
                <Input name="last_name" required />
              </Field>
            </div>
            <Field label="Email">
              <Input name="email" type="email" required />
            </Field>
            <Field label="Telephone" hint="Recommended so Paula can call you back">
              <Input name="phone" type="tel" />
            </Field>
            <Field label="Preferred contact method">
              <Select name="preferred_contact_method" defaultValue="phone">
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
            </Field>
            <Field label="What would you like help with?">
              <Select name="help_category" required defaultValue="">
                <option value="" disabled>
                  Select a category
                </option>
                {HELP_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Brief message"
              hint="Please keep this high-level. Do not include detailed medical history here."
            >
              <Textarea name="message" required />
            </Field>
            <Field label="How did you hear about Absolute Mind?">
              <Select name="lead_source" defaultValue="Website">
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input type="checkbox" name="marketing_email" className="mt-1 h-4 w-4 rounded border-slate-300" />
              <span>
                I&apos;d like to receive occasional emails from Absolute Mind about services,
                resources and updates.
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                name="privacy"
                required
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span>
                I understand Absolute Mind will use my details to respond to this enquiry. See the{" "}
                <a
                  href="https://absolutemind.co.uk/privacy"
                  className="font-medium text-brand hover:text-brand-strong"
                  target="_blank"
                  rel="noreferrer"
                >
                  privacy policy
                </a>
                .
              </span>
            </label>

            {/* Turnstile placeholder — configure site key in production */}
            <input type="hidden" name="cf-turnstile-response" value="demo" />

            {error ? (
              <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
              {pending ? "Sending…" : "Submit enquiry"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
