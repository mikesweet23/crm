import { logout } from "@/lib/data/crm";

export async function POST() {
  await logout();
  return Response.json({ ok: true });
}
