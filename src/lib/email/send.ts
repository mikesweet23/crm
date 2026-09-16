import { Resend } from "resend";
import type { Contact, Enquiry } from "@/lib/types";
import { fullName, displayPhone } from "@/lib/phone";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendPaulaEnquiryEmail(input: {
  contact: Contact;
  enquiry: Enquiry;
}) {
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
    console.info("[email:demo] Paula notification", subject);
    return { id: "demo-paula", skipped: true as const };
  }

  const result = await resend.emails.send({ from, to, subject, html });
  return { id: result.data?.id ?? null, skipped: false as const };
}

export async function sendEnquiryAcknowledgement(input: {
  contact: Contact;
  skip?: boolean;
}) {
  if (input.skip || input.contact.do_not_contact) {
    return { id: null, skipped: true as const };
  }
  if (!input.contact.email) {
    return { id: null, skipped: true as const };
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
    console.info("[email:demo] Acknowledgement", subject, input.contact.email);
    return { id: "demo-ack", skipped: true as const };
  }

  const result = await resend.emails.send({
    from,
    to: input.contact.email,
    subject,
    html,
  });
  return { id: result.data?.id ?? null, skipped: false as const };
}
