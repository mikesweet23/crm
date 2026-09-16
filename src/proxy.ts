import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/data/demo-store";

const PUBLIC_PATHS = ["/login", "/enquiry", "/embed", "/api/enquiries", "/api/auth"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and public routes
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

  // In demo mode, session is in-memory on the server — pages enforce auth themselves.
  // When Supabase is configured, refresh the session cookie here.
  if (!isDemoMode()) {
    // Lightweight gate: require presence of a Supabase auth cookie for private pages.
    const hasAuth = request.cookies
      .getAll()
      .some((c) => c.name.includes("sb-") && c.name.includes("auth-token"));
    if (!hasAuth && !pathname.startsWith("/api/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
