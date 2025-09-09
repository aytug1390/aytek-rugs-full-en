import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = { matcher: ["/admin/:path*"] };

export function middleware(req: NextRequest) {
  if (process.env.FORCE_ADMIN_AUTH === "0") return NextResponse.next();

  const p = req.nextUrl.pathname;

  // allowlist
  if (p.startsWith("/admin/login") || p.startsWith("/_next") || p.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("admin_sess")?.value;
  if (token !== "ok") {
    // slash'ları koru:
    return NextResponse.redirect("/admin/login?from=" + encodeURI(p));
  }
  return NextResponse.next();
}
