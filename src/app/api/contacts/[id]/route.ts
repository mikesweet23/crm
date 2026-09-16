import { getSession, getContact, updateContact } from "@/lib/data/crm";
import { z } from "zod";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const contact = await getContact(id);
  if (!contact) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ contact });
}

const patchSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  preferred_contact_method: z.enum(["phone", "email", "whatsapp"]).nullable().optional(),
  lead_source: z.string().nullable().optional(),
  important_note: z.string().nullable().optional(),
  marketing_email: z.boolean().optional(),
  marketing_sms: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const contact = await updateContact(id, parsed.data);
  if (!contact) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ contact });
}
