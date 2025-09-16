import { NextResponse } from "next/server";
import { headers } from "next/headers";

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

  const res = NextResponse.json({ ok: true });
  res.headers.set("x-logout-secure", String(secure));
  res.headers.set("x-logout-proto", proto);
  res.headers.set("x-logout-host", host);

  res.cookies.set({
    name: "admin_sess",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });

  return res;
}
