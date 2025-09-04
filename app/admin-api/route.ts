import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:5000";
const upstream = (path = "") => new URL(API_ORIGIN + "/admin-api" + path);

// --- temporary debug flag (remove later)
const DEBUG = process.env.API_DEBUG === "1";

function htmlToJson(resp: Response, pathname: string) {
  const info = { ok: false, upstream: "html_error", path: pathname, status: resp.status };
  return NextResponse.json(info, { status: 502 });
}

async function passthrough(method: string, req: NextRequest, pathname = "") {
  const url = upstream(pathname);
  // forward query
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  try {
    const headers: Record<string, string> = {
      // prefer JSON from upstream
      Accept: "application/json",
    };

    // forward auth
    const auth = req.headers.get("authorization");
    if (auth) headers["authorization"] = auth;

    const cookie = req.headers.get("cookie");
    if (cookie) headers["cookie"] = cookie;

    // optional context
    const ip = req.headers.get("x-forwarded-for");
    if (ip) headers["x-forwarded-for"] = ip;

    const init: RequestInit = { method, cache: "no-store", headers } as RequestInit;

    if (method !== "GET" && method !== "HEAD") {
      headers["content-type"] = req.headers.get("content-type") ?? "application/json";
      init.body = await req.text();
    }
    const resp = await fetch(url, init);

    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("text/html")) return htmlToJson(resp, pathname);

    // Pass-through success/error as-is when JSON-ish
    return new Response(resp.body, { status: resp.status, headers: resp.headers });
  } catch {
    // Upstream unreachable
    return NextResponse.json({ ok: false, offline: true, path: pathname }, { status: 502 });
  }
}

export async function GET(req: NextRequest) { return passthrough("GET", req, ""); }
export async function POST(req: NextRequest) { return passthrough("POST", req, ""); }
export async function OPTIONS(req: NextRequest) { return passthrough("OPTIONS", req, ""); }
