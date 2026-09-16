import { getSession, addActivity } from "@/lib/data/crm";
import { z } from "zod";

const schema = z.object({
  activity_type: z.enum(["note", "call", "whatsapp", "email_sent", "email_received"]),
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(8000).optional(),
});

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
  const titles: Record<string, string> = {
    note: "Note",
    call: `Call logged by ${name}`,
    whatsapp: "WhatsApp contact",
    email_sent: "Email sent",
    email_received: "Email received",
  };

  const activity = await addActivity({
    contact_id: id,
    activity_type: parsed.data.activity_type,
    title: parsed.data.title || titles[parsed.data.activity_type],
    body: parsed.data.body ?? null,
    created_by: session.user.id,
    created_by_name: name,
  });

  return Response.json({ activity });
}
