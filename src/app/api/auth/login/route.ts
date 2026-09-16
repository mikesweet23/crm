import { DEMO_SESSION_COOKIE } from "@/lib/data/demo-auth";
import { isDemoMode, loginWithPassword } from "@/lib/data/crm";
import { demoFindUserByEmail } from "@/lib/data/demo-store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "");
  const password = String(body.password || "");

  if (isDemoMode()) {
    const profile = demoFindUserByEmail(email);
    if (!profile) {
      return NextResponse.json(
        { error: "Unknown demo user. Try paula@absolutemind.co.uk or mike@absolutemind.co.uk" },
        { status: 401 },
      );
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(DEMO_SESSION_COOKIE, profile.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  }

  const result = await loginWithPassword(email, password);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
