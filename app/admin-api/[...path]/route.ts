import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:5000";
const upstream = (path = "") => new URL(API_ORIGIN + "/admin-api" + path);

const DEBUG = process.env.API_DEBUG === "1";

function htmlToJson(resp: Response, pathname: string) {
  const info = { ok: false, upstream: "html_error", path: pathname, status: resp.status };
  return NextResponse.json(info, { status: 502 });
}

async function passthrough(method: string, req: NextRequest, pathname: string) {
  const url = upstream(pathname);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    const auth = req.headers.get("authorization");
    if (auth) headers["authorization"] = auth;

    const cookie = req.headers.get("cookie");
    if (cookie) headers["cookie"] = cookie;

    const ip = req.headers.get("x-forwarded-for");
    if (ip) headers["x-forwarded-for"] = ip;

    const init: RequestInit = { method, cache: "no-store", headers } as RequestInit;

    if (method !== "GET" && method !== "HEAD") {
      headers["content-type"] = req.headers.get("content-type") ?? "application/json";
      init.body = await req.text();
    }

    const resp = await fetch(url, init);

    const ct = resp.headers.get("content-type") || "";
    if (DEBUG) console.log(`[proxy] ${method} ${url.pathname}${url.search} -> ${resp.status} (${ct})`);

    if (ct.includes("text/html")) return htmlToJson(resp, pathname);

    return new Response(resp.body, { status: resp.status, headers: resp.headers });
  } catch (err) {
    if (DEBUG) console.error(`[proxy] ${method} ${url.pathname}${url.search} -> upstream unreachable`, err);
    return NextResponse.json({ ok: false, offline: true, path: pathname }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: any) {
  const params = await ctx.params;
  const pathname = "/" + (params?.path?.join("/") ?? "");
  return passthrough("GET", req, pathname);
}
export async function POST(req: NextRequest, ctx: any) {
  const params = await ctx.params;
  const pathname = "/" + (params?.path?.join("/") ?? "");
  return passthrough("POST", req, pathname);
}
export async function OPTIONS(req: NextRequest, ctx: any) {
  const params = await ctx.params;
  const pathname = "/" + (params?.path?.join("/") ?? "");
  return passthrough("OPTIONS", req, pathname);
}
