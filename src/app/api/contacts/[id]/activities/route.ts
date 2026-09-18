import { getSession, addActivity } from "@/lib/data/crm";
import { CHANNEL_ACTIVITY_TITLES, type ChannelActivityType } from "@/lib/contact-actions";
import { z } from "zod";

const CHANNEL_TYPES = ["call_opened", "sms_opened", "whatsapp_opened", "email_opened"] as const;

const schema = z.object({
  activity_type: z.enum([
    "note",
    "call",
    "whatsapp",
    "email_sent",
    "email_received",
    ...CHANNEL_TYPES,
  ]),
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(8000).optional(),
});

function isChannelType(type: string): type is ChannelActivityType {
  return (CHANNEL_TYPES as readonly string[]).includes(type);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const name = session.profile?.full_name ?? session.user.email;
  const legacyTitles: Record<string, string> = {
    note: "Note",
    call: `Call logged by ${name}`,
    whatsapp: "WhatsApp contact",
    email_sent: "Email sent",
    email_received: "Email received",
  };

  // Channel-opened activities use fixed labels so the timeline can never imply a
  // message was sent/delivered/replied — only that the channel was opened.
  const title = isChannelType(parsed.data.activity_type)
    ? CHANNEL_ACTIVITY_TITLES[parsed.data.activity_type]
    : parsed.data.title || legacyTitles[parsed.data.activity_type];

  const activity = await addActivity({
    contact_id: id,
    activity_type: parsed.data.activity_type,
    title,
    body: isChannelType(parsed.data.activity_type) ? null : parsed.data.body ?? null,
    created_by: session.user.id,
    created_by_name: name,
  });

  return Response.json({ activity });
}
