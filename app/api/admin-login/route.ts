export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

function computeSecure(h: Headers, req: NextRequest): boolean {
  // Lokal geliştirmede Secure'ı kapatmak için override
  const allow = process.env.ALLOW_INSECURE_COOKIE === "1" ||
                process.env.ALLOW_INSECURE_COOKIE?.toLowerCase() === "true";
  if (allow) return false;

  const proto = (h.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "") || "http").toString();
  const host  = (h.get("host") || new URL(req.url).host || "").toLowerCase();
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]") || host.startsWith("::1");
  return !isLocalhost && proto === "https";
}

export async function GET() {
  return new NextResponse("admin-login route.ts v2", {
    status: 200,
    headers: { "x-route": "v2" },
  });
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  let password = "", from = "";

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({} as any));
    password = body?.password ?? "";
    from     = body?.from ?? "";
  } else if (ct.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    password = String(form.get("password") ?? "");
    from     = String(form.get("from") ?? "");
  } else {
    return NextResponse.json({ error: "Unsupported Media Type" }, { status: 415 });
  }

  const ok = password === (process.env.ADMIN_PASSWORD || "AytekAdmin2025!");
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const h = await headers();
  const secure = computeSecure(h as unknown as Headers, req);
  const proto  = (h.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "")).toString();
  const host   = (h.get("host") || new URL(req.url).host).toString();

  const to = typeof from === "string" && from.startsWith("/admin") ? from : "/admin";
  const res = NextResponse.redirect(new URL(to, req.url), { status: 307 });

  // Debug başlıkları
  res.headers.set("x-route", "v2");
  res.headers.set("x-login-secure", String(secure));
  res.headers.set("x-login-proto", proto);
  res.headers.set("x-login-host", host);

  // Çerezi response üzerinden yaz (NextResponse.cookies.set)
  res.cookies.set({
    name: "admin_sess",
    value: "ok",
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 saat
  });

  return res;
}
