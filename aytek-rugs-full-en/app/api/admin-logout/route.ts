import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { jsonUtf8 } from '@/lib/responses';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const hdrs = await headers();

  const allowInsecure =
    process.env.ALLOW_INSECURE_COOKIE === "1" ||
    (process.env.ALLOW_INSECURE_COOKIE ?? "").toLowerCase() === "true";

  const proto =
    (hdrs.get("x-forwarded-proto") ||
      new URL(req.url).protocol.replace(":", "") ||
      "http").toString();

  const host = (hdrs.get("host") || new URL(req.url).host || "").toLowerCase();

  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]") ||
    host.startsWith("::1");

  const secure = !allowInsecure && proto === "https" && !isLocal;

  const res = NextResponse.json(
    { ok: true },
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
  res.headers.set("x-logout-secure", String(secure));
  res.headers.set("x-logout-proto", proto);
  res.headers.set("x-logout-host", host);

  const cookieDomain = process.env.ADMIN_COOKIE_DOMAIN || undefined;
  const rawSameSite = (process.env.ADMIN_COOKIE_SAMESITE || 'Lax').toLowerCase();
  // Type cast to allowed ResponseCookie sameSite union type: 'lax' | 'strict' | 'none'
  const sameSite = (['lax', 'strict', 'none'].includes(rawSameSite) ? rawSameSite : 'lax') as 'lax' | 'strict' | 'none';
  // Clear cookie using set(name, value, opts)
  res.cookies.set('admin_sess', '', { httpOnly: true, sameSite, secure, domain: cookieDomain, path: '/', maxAge: 0 });

  return res;
}
