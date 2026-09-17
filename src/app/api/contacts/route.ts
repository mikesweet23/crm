import { z } from "zod";
import { getSession, searchContacts, listPipelineContacts, createContact } from "@/lib/data/crm";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (q) {
    const contacts = await searchContacts(q);
    return Response.json({ contacts });
  }
  const contacts = await listPipelineContacts();
  return Response.json({ contacts });
}

const createSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required.").max(80),
  last_name: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().max(160).email("Enter a valid email address.").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  lead_source: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json({ error: first?.message || "Please check the form." }, { status: 400 });
  }

  const email = parsed.data.email?.trim() ?? "";
  const phone = parsed.data.phone?.trim() ?? "";
  if (!email && !phone) {
    return Response.json(
      { error: "Add an email or telephone number so the contact is reachable." },
      { status: 400 },
    );
  }

  const name = session.profile?.full_name ?? session.user.email;
  try {
    const contact = await createContact({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: email || null,
      phone: phone || null,
      lead_source: parsed.data.lead_source || "Manual entry",
      user: { id: session.user.id, name },
    });
    return Response.json({ contact }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not save the contact. Please try again." }, { status: 500 });
  }
}
