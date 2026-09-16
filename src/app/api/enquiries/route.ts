import { z } from "zod";
import { submitEnquiry, addActivity, isDemoMode } from "@/lib/data/crm";
import { sendEnquiryAcknowledgement, sendPaulaEnquiryEmail } from "@/lib/email/send";

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
  turnstile_token: z.string().optional(),
  landing_page: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

const recentSubmissions = new Map<string, number>();

async function verifyTurnstile(token: string | undefined, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Allow in demo / until Turnstile is configured
    return isDemoMode() || token === "demo" || Boolean(token);
  }
  if (!token) return false;
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

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

  const ok = await verifyTurnstile(parsed.data.turnstile_token, ip);
  if (!ok) {
    return Response.json({ error: "Spam check failed. Please try again." }, { status: 400 });
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

  await sendPaulaEnquiryEmail({ contact: result.contact, enquiry: result.enquiry });

  if (!result.isDnc) {
    const ack = await sendEnquiryAcknowledgement({ contact: result.contact });
    await addActivity({
      contact_id: result.contact.id,
      activity_type: "email_sent",
      title: "Acknowledgement email sent",
      body: ack.skipped
        ? "Acknowledgement prepared (email provider not configured or skipped)."
        : "Automatic enquiry acknowledgement sent.",
      automatic: true,
      created_by_name: "System",
    });
  }

  return Response.json({
    ok: true,
    contact_id: result.contact.id,
    enquiry_id: result.enquiry.id,
    created_new: result.createdNew,
    do_not_contact: result.isDnc,
  });
}
