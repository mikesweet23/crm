import { Resend } from "resend";
import type { Contact, Enquiry } from "@/lib/types";
import { fullName, displayPhone } from "@/lib/phone";

/**
 * Outcome of an attempt to hand an email to the provider.
 * - `sent`: the provider accepted the message (NOT a guarantee of inbox delivery).
 * - `skipped`: nothing was attempted (provider not configured, no recipient, suppressed).
 * - `failed`: the provider was called but rejected/errored the request.
 */
export type EmailResult =
  | { status: "sent"; id: string | null }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendPaulaEnquiryEmail(input: {
  contact: Contact;
  enquiry: Enquiry;
}): Promise<EmailResult> {
  const resend = getResend();
  const to = process.env.PAULA_NOTIFY_EMAIL || "paula@paulasweet.co.uk";
  const from = process.env.EMAIL_FROM || "Absolute Mind <onboarding@resend.dev>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const name = fullName(input.contact.first_name, input.contact.last_name);
  const subject = `New Absolute Mind enquiry: ${name}`;
  const crmLink = `${appUrl}/contacts/${input.contact.id}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; color: #3f3f42; line-height: 1.5;">
      <h2 style="color: #0f172b;">New Absolute Mind enquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Telephone:</strong> ${displayPhone(input.contact.phone) || "—"}</p>
      <p><strong>Email:</strong> ${input.contact.email || "—"}</p>
      <p><strong>Preferred contact:</strong> ${input.contact.preferred_contact_method || "—"}</p>
      <p><strong>Help category:</strong> ${input.enquiry.help_category || "—"}</p>
      <p><strong>Message:</strong><br/>${(input.enquiry.message || "—").replace(/\n/g, "<br/>")}</p>
      <p><strong>Lead source:</strong> ${input.enquiry.lead_source || "—"}</p>
      <p style="margin-top: 24px;">
        <a href="${crmLink}" style="background:#e5772a;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;">
          Open in CRM
        </a>
      </p>
    </div>
  `;

  if (!resend) {
    console.info("[email] Paula notification skipped — provider not configured:", subject);
    return { status: "skipped", reason: "email provider not configured" };
  }

  try {
    const result = await resend.emails.send({ from, to, subject, html });
    if (result.error) {
      console.error("[email] Paula notification failed:", result.error);
      return { status: "failed", reason: result.error.message || "provider error" };
    }
    return { status: "sent", id: result.data?.id ?? null };
  } catch (err) {
    console.error("[email] Paula notification threw:", err);
    return { status: "failed", reason: err instanceof Error ? err.message : "provider error" };
  }
}

export async function sendEnquiryAcknowledgement(input: {
  contact: Contact;
  skip?: boolean;
}): Promise<EmailResult> {
  if (input.skip || input.contact.do_not_contact) {
    return { status: "skipped", reason: "recipient is on Do Not Contact" };
  }
  if (!input.contact.email) {
    return { status: "skipped", reason: "no email address on file" };
  }

  const resend = getResend();
  const from = process.env.EMAIL_FROM || "Absolute Mind <onboarding@resend.dev>";
  const name = input.contact.first_name;
  const subject = "We've received your Absolute Mind enquiry";
  const html = `
    <div style="font-family: system-ui, sans-serif; color: #3f3f42; line-height: 1.6;">
      <p>Hello ${name},</p>
      <p>Thank you for getting in touch with Absolute Mind. Your enquiry has been received and Paula will respond as soon as she can.</p>
      <p>If your matter is urgent, you can call Absolute Mind on <a href="tel:+447713385007">07713 385007</a>.</p>
      <p>Warm regards,<br/>Absolute Mind<br/>
      <a href="https://absolutemind.co.uk">absolutemind.co.uk</a></p>
    </div>
  `;

  if (!resend) {
    console.info("[email] Acknowledgement skipped — provider not configured:", input.contact.email);
    return { status: "skipped", reason: "email provider not configured" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: input.contact.email,
      subject,
      html,
    });
    if (result.error) {
      console.error("[email] Acknowledgement failed:", result.error);
      return { status: "failed", reason: result.error.message || "provider error" };
    }
    return { status: "sent", id: result.data?.id ?? null };
  } catch (err) {
    console.error("[email] Acknowledgement threw:", err);
    return { status: "failed", reason: err instanceof Error ? err.message : "provider error" };
  }
}
