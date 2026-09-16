import { getSession, searchContacts, listPipelineContacts } from "@/lib/data/crm";

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
