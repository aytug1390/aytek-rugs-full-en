import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_ORIGIN = (process.env.API_ORIGIN ?? "http://127.0.0.1:5001").replace(/\/+$/, "");

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const pathname = "/" + (params.path?.join("/") ?? ""); // e.g. /uploads/abc.jpg
  const url = API_ORIGIN + pathname;

  try {
    const resp = await fetch(url, {
      headers: {
        Accept: "image/*",
        ...(req.headers.get("cookie") ? { cookie: req.headers.get("cookie")! } : {}),
      },
      cache: "no-store",
    });

    // If upstream failed or isn't an image, return placeholder
    const ct = resp.headers.get("content-type") || "";
    if (!resp.ok || !ct.startsWith("image/")) {
      const ph = await fetch(new URL("/placeholder.jpg", req.nextUrl.origin), { cache: "no-store" });
      return new Response(ph.body, { status: 200, headers: ph.headers });
    }

    const headers = new Headers(resp.headers);
    headers.delete("set-cookie");
    return new Response(resp.body, { status: resp.status, headers });
  } catch (err) {
    const ph = await fetch(new URL("/placeholder.jpg", req.nextUrl.origin), { cache: "no-store" });
    return new Response(ph.body, { status: 200, headers: ph.headers });
  }
}
