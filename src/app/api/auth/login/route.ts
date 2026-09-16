import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "");
  const password = String(body.password || "");

  const { loginWithPassword } = await import("@/lib/data/crm");
  const result = await loginWithPassword(email, password);
  if (result.error) {
    return Response.json({ error: result.error }, { status: 401 });
  }
  return Response.json({ ok: true });
}

export async function GET() {
  redirect("/login");
}
