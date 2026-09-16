import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/data/demo-store";
import { DEMO_SESSION_COOKIE } from "@/lib/data/demo-cookie";

const PUBLIC_PATHS = ["/login", "/enquiry", "/embed", "/api/enquiries", "/api/auth"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/absolute-mind") ||
    pathname === "/embed.js" ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next();
  }

  if (isDemoMode()) {
    const hasDemo = Boolean(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
    if (!hasDemo && !pathname.startsWith("/api/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const hasAuth = request.cookies
    .getAll()
    .some((c) => c.name.includes("sb-") && c.name.includes("auth-token"));
  if (!hasAuth && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
