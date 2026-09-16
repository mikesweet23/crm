import { getSession, markDoNotContact } from "@/lib/data/crm";
import { z } from "zod";

const schema = z.object({
  reason: z.string().trim().min(1).max(2000),
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
    return Response.json({ error: "Reason required" }, { status: 400 });
  }

  const contact = await markDoNotContact(id, parsed.data.reason, {
    id: session.user.id,
    name: session.profile?.full_name ?? session.user.email,
  });
  if (!contact) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ contact });
}
