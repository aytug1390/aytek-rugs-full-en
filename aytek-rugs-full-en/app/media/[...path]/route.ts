import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_ORIGIN = (process.env.API_ORIGIN ?? "http://127.0.0.1:5000").replace(/\/+$/, "");

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
      const phHeaders = new Headers(ph.headers);
      phHeaders.set('X-Content-Type-Options', 'nosniff');
      phHeaders.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
      return new Response(ph.body, { status: 200, headers: phHeaders });
    }

    const headers = new Headers();
    // forward only safe headers
    const fwdCT = resp.headers.get('content-type');
    if (fwdCT) headers.set('Content-Type', fwdCT);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
    return new Response(resp.body, { status: resp.status, headers });
  } catch (err) {
    const ph = await fetch(new URL("/placeholder.jpg", req.nextUrl.origin), { cache: "no-store" });
    return new Response(ph.body, { status: 200, headers: ph.headers });
  }
}
