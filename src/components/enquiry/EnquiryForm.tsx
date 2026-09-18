"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import {
  TURNSTILE_ENABLED,
  TURNSTILE_SITE_KEY,
  Turnstile,
  type TurnstileHandle,
} from "@/components/enquiry/Turnstile";
import { HELP_CATEGORIES, LEAD_SOURCES } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface EnquiryFormConfig {
  source?: string;
  heading?: string | null;
  intro?: string | null;
  accent?: string | null;
  submitLabel?: string;
  showPhone?: boolean;
  showPreferred?: boolean;
  showCategory?: boolean;
  showMessage?: boolean;
  showMarketing?: boolean;
  showSource?: boolean;
  compact?: boolean;
  bookingUrl?: string | null;
  privacyUrl?: string;
  className?: string;
}

const DEFAULTS: Required<
  Omit<EnquiryFormConfig, "heading" | "intro" | "accent" | "bookingUrl" | "className">
> = {
  source: "Website",
  submitLabel: "Submit enquiry",
  showPhone: true,
  showPreferred: true,
  showCategory: true,
  showMessage: true,
  showMarketing: true,
  showSource: true,
  compact: false,
  privacyUrl: "https://absolutemind.co.uk/privacy",
};

function accentStyle(accent?: string | null): CSSProperties | undefined {
  if (!accent) return undefined;
  return {
    // These CSS variables cascade to every `bg-brand`, `text-brand`,
    // `border-brand` and `focus:ring-brand-soft` descendant.
    ["--brand" as string]: accent,
    ["--brand-strong" as string]: `color-mix(in srgb, ${accent}, black 15%)`,
    ["--brand-soft" as string]: `color-mix(in srgb, ${accent}, white 82%)`,
  } as CSSProperties;
}

export function EnquiryForm(props: EnquiryFormConfig) {
  // Callers (e.g. the embed) may pass explicit `undefined` values, which would
  // otherwise override the defaults when spread.
  const cfg = {
    ...DEFAULTS,
    ...props,
    source: props.source || DEFAULTS.source,
    submitLabel: props.submitLabel || DEFAULTS.submitLabel,
    privacyUrl: props.privacyUrl || DEFAULTS.privacyUrl,
  };
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Honeypot — silently succeed for bots
    if (String(fd.get("company") || "")) {
      setDone(true);
      return;
    }

    // Turnstile also mirrors its token into a hidden `cf-turnstile-response`
    // input when the widget sits inside the form; prefer our tracked state.
    const token = turnstileToken || String(fd.get("cf-turnstile-response") || "") || null;
    if (TURNSTILE_ENABLED && !token) {
      setError("Please wait for the spam check to finish, then try again.");
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
          lead_source: fd.get("lead_source") || cfg.source,
          marketing_email: fd.get("marketing_email") === "on",
          privacy: fd.get("privacy") === "on",
          turnstile_token: token ?? undefined,
          landing_page:
            typeof window !== "undefined"
              ? document.referrer || window.location.href
              : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to send enquiry");
        // Tokens are single-use: issue a fresh challenge before the next attempt.
        turnstileRef.current?.reset();
        return;
      }
      setDone(true);
      form.reset();
    });
  }

  const gap = cfg.compact ? "space-y-3" : "space-y-4";

  return (
    <div className={cn("w-full", cfg.className)} style={accentStyle(cfg.accent)}>
      {cfg.heading ? (
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{cfg.heading}</h2>
          {cfg.intro ? (
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{cfg.intro}</p>
          ) : null}
        </div>
      ) : null}

      {done ? (
        <div className="animate-fade-up rounded-2xl border border-emerald-200 bg-success-soft p-6 text-center sm:p-8">
          <p className="text-lg font-semibold text-success">Thank you</p>
          <p className="mt-2 text-sm text-emerald-800">
            Your enquiry has been received. Paula will be in touch soon.
          </p>
          {cfg.bookingUrl ? (
            <a
              href={cfg.bookingUrl}
              target="_top"
              rel="noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong"
            >
              Book your consultation →
            </a>
          ) : (
            <button
              type="button"
              className="mt-6 text-sm font-medium text-brand"
              onClick={() => setDone(false)}
            >
              Send another enquiry
            </button>
          )}
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className={cn(
            "animate-fade-up rounded-2xl border border-slate-200 bg-white/90 shadow-sm",
            cfg.compact ? "p-4 sm:p-5" : "p-5 sm:p-8",
            gap,
          )}
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
              <Input name="first_name" required autoComplete="given-name" />
            </Field>
            <Field label="Last name">
              <Input name="last_name" required autoComplete="family-name" />
            </Field>
          </div>

          <Field label="Email">
            <Input name="email" type="email" required autoComplete="email" />
          </Field>

          {cfg.showPhone ? (
            <Field label="Telephone" hint="Recommended so Paula can call you back">
              <Input name="phone" type="tel" autoComplete="tel" />
            </Field>
          ) : null}

          {cfg.showPreferred ? (
            <Field label="Preferred contact method">
              <Select name="preferred_contact_method" defaultValue="phone">
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
            </Field>
          ) : null}

          {cfg.showCategory ? (
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
          ) : null}

          {cfg.showMessage ? (
            <Field
              label="Brief message"
              hint="Please keep this high-level. Do not include detailed medical history here."
            >
              <Textarea name="message" required />
            </Field>
          ) : null}

          {cfg.showSource ? (
            <Field label="How did you hear about Absolute Mind?">
              <Select name="lead_source" defaultValue={cfg.source}>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <input type="hidden" name="lead_source" value={cfg.source} />
          )}

          {cfg.showMarketing ? (
            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                name="marketing_email"
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span>
                I&apos;d like to receive occasional emails from Absolute Mind about services,
                resources and updates.
              </span>
            </label>
          ) : null}

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
                href={cfg.privacyUrl}
                className="font-medium text-brand hover:text-brand-strong"
                target="_blank"
                rel="noreferrer"
              >
                privacy policy
              </a>
              .
            </span>
          </label>

          {TURNSTILE_ENABLED ? (
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              action="enquiry"
              onToken={setTurnstileToken}
            />
          ) : null}

          {error ? (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
            {pending ? "Sending…" : cfg.submitLabel}
          </Button>
        </form>
      )}
    </div>
  );
}
