"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { displayPhone } from "@/lib/phone";
import {
  gmailComposeHref,
  mailtoHref,
  smsHref,
  telHref,
  whatsappHref,
  type ChannelActivityType,
} from "@/lib/contact-actions";
import { cn } from "@/lib/utils";

/** Open an external URL in a new tab without leaking the opener. Returns the
 * window (or null if the browser blocked it), so callers can fall back. */
function openExternal(href: string): Window | null {
  const win = window.open(href, "_blank");
  if (win) win.opener = null;
  return win;
}

function useRecordActivity(contactId: string) {
  const router = useRouter();
  return (type: ChannelActivityType) => {
    // Best-effort: the action has already opened; logging must not block it.
    fetch(`/api/contacts/${contactId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity_type: type }),
    })
      .then(() => router.refresh())
      .catch(() => {});
  };
}

const triggerClass =
  "rounded-md font-medium text-ink underline decoration-slate-300 decoration-1 underline-offset-2 transition hover:decoration-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft";

export function ContactPhone({ contactId, phone }: { contactId: string; phone: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const record = useRecordActivity(contactId);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items: {
    type: ChannelActivityType;
    label: string;
    href: string | null;
    external: boolean;
  }[] = [
    { type: "call_opened", label: "Call", href: telHref(phone), external: false },
    { type: "sms_opened", label: "Text message", href: smsHref(phone), external: false },
    { type: "whatsapp_opened", label: "WhatsApp", href: whatsappHref(phone), external: true },
  ];

  function act(type: ChannelActivityType, href: string | null, external: boolean) {
    setOpen(false);
    if (href) {
      if (external) openExternal(href);
      else window.location.assign(href); // tel:/sms: hand off to the OS, page stays
    }
    record(type);
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(triggerClass, "inline-flex items-center gap-1")}
      >
        {displayPhone(phone)}
        <span aria-hidden className="text-xs text-muted">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={`Contact ${displayPhone(phone)} by`}
          className="absolute left-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.type}
              role="menuitem"
              type="button"
              disabled={!item.href}
              onClick={() => act(item.type, item.href, item.external)}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-ink transition hover:bg-brand-soft/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ContactEmail({ contactId, email }: { contactId: string; email: string }) {
  const record = useRecordActivity(contactId);

  function onClick() {
    const gmail = gmailComposeHref(email);
    const mailto = mailtoHref(email);
    const opened = gmail ? openExternal(gmail) : null;
    if (!opened && mailto) window.location.assign(mailto); // popup blocked → email app
    record("email_opened");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="Compose an email in Gmail"
      className={cn(triggerClass, "break-all text-left")}
    >
      {email}
    </button>
  );
}
