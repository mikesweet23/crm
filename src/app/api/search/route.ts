import { getSession, searchContacts } from "@/lib/data/crm";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q") || "";
  if (q.trim().length < 2) return Response.json({ contacts: [] });
  const contacts = await searchContacts(q);
  return Response.json({ contacts });
}
