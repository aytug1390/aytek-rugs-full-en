import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin-api/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/admin-api\//, "/api/admin-api/");
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-api/:path*"],
};
