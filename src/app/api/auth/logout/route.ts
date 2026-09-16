import { DEMO_SESSION_COOKIE } from "@/lib/data/demo-auth";
import { isDemoMode, logout } from "@/lib/data/crm";
import { NextResponse } from "next/server";

export async function POST() {
  if (isDemoMode()) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(DEMO_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  }
  await logout();
  return NextResponse.json({ ok: true });
}
