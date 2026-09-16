import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/data/demo-cookie";

export { DEMO_SESSION_COOKIE };

export async function getDemoUserIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(DEMO_SESSION_COOKIE)?.value ?? null;
}

export async function setDemoUserCookie(userId: string) {
  const jar = await cookies();
  jar.set(DEMO_SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearDemoUserCookie() {
  const jar = await cookies();
  jar.delete(DEMO_SESSION_COOKIE);
}
