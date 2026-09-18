import { normalisePhone } from "@/lib/phone";

/**
 * Activity types recorded when Paula opens a contact channel. These describe an
 * intent to reach out (opened/initiated) — never that a message was sent,
 * delivered, or replied to.
 */
export type ChannelActivityType =
  | "call_opened"
  | "sms_opened"
  | "whatsapp_opened"
  | "email_opened";

export const CHANNEL_ACTIVITY_TITLES: Record<ChannelActivityType, string> = {
  call_opened: "Call opened",
  sms_opened: "Text message opened",
  whatsapp_opened: "WhatsApp opened",
  email_opened: "Email compose opened",
};

/**
 * Normalise to an E.164-style number with a leading `+`, or `null`.
 * National-format numbers are assumed to be UK (the practice is UK-based).
 */
export function toE164(phone: string | null | undefined): string | null {
  const normalised = normalisePhone(phone);
  if (!normalised) return null;
  if (normalised.startsWith("+")) return normalised;
  const digits = normalised.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) return `+44${digits.slice(1)}`;
  return `+${digits}`;
}

export function telHref(phone: string | null | undefined): string | null {
  const e164 = toE164(phone);
  return e164 ? `tel:${e164}` : null;
}

export function smsHref(phone: string | null | undefined): string | null {
  const e164 = toE164(phone);
  return e164 ? `sms:${e164}` : null;
}

/** International number in digits only, without the `+`, as wa.me requires. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  const e164 = toE164(phone);
  return e164 ? e164.replace(/\D/g, "") : null;
}

export function whatsappHref(phone: string | null | undefined): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}` : null;
}

/** Gmail compose window pre-addressed to the recipient (does not send). */
export function gmailComposeHref(email: string | null | undefined): string | null {
  const address = email?.trim();
  if (!address) return null;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(address)}`;
}

export function mailtoHref(email: string | null | undefined): string | null {
  const address = email?.trim();
  if (!address) return null;
  return `mailto:${encodeURIComponent(address).replace(/%40/g, "@")}`;
}
