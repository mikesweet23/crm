import { z } from "zod";
import { submitEnquiry, addSystemActivity } from "@/lib/data/crm";
import { sendEnquiryAcknowledgement, sendPaulaEnquiryEmail } from "@/lib/email/send";
import { ACK_LABEL, NOTIFY_LABEL, emailActivity } from "@/lib/email/activity";
import { verifyTurnstileToken } from "@/lib/turnstile";

const schema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  preferred_contact_method: z.enum(["phone", "email", "whatsapp"]).optional(),
  help_category: z.string().trim().max(120).optional(),
  message: z.string().trim().max(4000).optional(),
  lead_source: z.string().trim().max(80).optional(),
  marketing_email: z.boolean().optional(),
  privacy: z.boolean().optional(),
  turnstile_token: z.string().max(2048).optional(),
  landing_page: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

const recentSubmissions = new Map<string, number>();

const TURNSTILE_ERRORS = {
  missing: {
    status: 400,
    error: "Please complete the spam check and try again.",
  },
  invalid: {
    status: 400,
    error: "Spam check failed. Please refresh the page and try again.",
  },
  unavailable: {
    status: 503,
    error: "The spam check is temporarily unavailable. Please try again in a moment.",
  },
} as const;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const last = recentSubmissions.get(ip) ?? 0;
  if (now - last < 8000) {
    return Response.json({ error: "Please wait a moment before submitting again." }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Please check the form and try again." }, { status: 400 });
  }
  if (parsed.data.privacy === false) {
    return Response.json({ error: "Privacy acknowledgement is required." }, { status: 400 });
  }

  const turnstile = await verifyTurnstileToken(parsed.data.turnstile_token, ip);
  if (!turnstile.ok) {
    const { status, error } = TURNSTILE_ERRORS[turnstile.reason];
    return Response.json({ error, code: `turnstile_${turnstile.reason}` }, { status });
  }

  recentSubmissions.set(ip, now);

  const result = await submitEnquiry({
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    email: parsed.data.email,
    phone: parsed.data.phone || undefined,
    preferred_contact_method: parsed.data.preferred_contact_method,
    help_category: parsed.data.help_category,
    message: parsed.data.message,
    lead_source: parsed.data.lead_source,
    marketing_email: parsed.data.marketing_email,
    landing_page: parsed.data.landing_page,
    utm: {
      utm_source: parsed.data.utm_source,
      utm_medium: parsed.data.utm_medium,
      utm_campaign: parsed.data.utm_campaign,
      utm_content: parsed.data.utm_content,
      utm_term: parsed.data.utm_term,
    },
  });

  // The enquiry is already stored. Send both emails independently and
  // best-effort — the acknowledgement to the enquirer and a separate
  // notification to Paula — so one failing must not stop the other or fail the
  // request. Both helpers catch their own errors and return a status; the
  // acknowledgement self-skips for Do Not Contact / missing email.
  const [notifyResult, ackResult] = await Promise.all([
    sendPaulaEnquiryEmail({ contact: result.contact, enquiry: result.enquiry }),
    sendEnquiryAcknowledgement({ contact: result.contact }),
  ]);

  // Log each outcome as its own activity so the timeline shows exactly which
  // email was sent, skipped, or failed. Logging must never 500 a stored enquiry.
  await Promise.all(
    [
      emailActivity(result.contact.id, NOTIFY_LABEL, notifyResult),
      emailActivity(result.contact.id, ACK_LABEL, ackResult),
    ].map(async (activity) => {
      try {
        await addSystemActivity(activity);
      } catch (err) {
        console.error(`Failed to log email activity "${activity.title}":`, err);
      }
    }),
  );

  return Response.json({
    ok: true,
    contact_id: result.contact.id,
    enquiry_id: result.enquiry.id,
    created_new: result.createdNew,
    do_not_contact: result.isDnc,
  });
}
