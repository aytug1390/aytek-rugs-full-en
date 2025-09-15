import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify, getSessionCookie } from "./lib/session";

const PROTECTED = [/^\/admin(\/|$)/];

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;
  if (!PROTECTED.some(rx => rx.test(url))) return NextResponse.next();

  const token = req.cookies.get(getSessionCookie())?.value;
  const sess = verify(token);
  if (!sess) return NextResponse.redirect(new URL("/admin/login", req.url));

  // RBAC: roles: ['owner'|'admin'|'editor']
  const needOwner = /^\/admin\/danger/.test(url);
  if (needOwner && !sess.roles?.includes("owner")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
