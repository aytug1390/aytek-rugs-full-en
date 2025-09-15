// app/api/drive/route.ts
import { NextRequest } from "next/server";
const UPSTREAM =
  process.env.API_ORIGIN ??
  process.env.ADMIN_API_ORIGIN ??
  "http://127.0.0.1:5000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const src = searchParams.get("src");
  if (!src) return new Response("src required", { status: 400 });

  // Backend origin (env or localhost)
  const origin = process.env.ADMIN_API_ORIGIN ?? UPSTREAM;
  const u = new URL("/api/drive", origin);
  u.searchParams.set("src", src);
  if (searchParams.get("sz")) u.searchParams.set("sz", searchParams.get("sz")!);

  const be = await fetch(u.toString(), { headers: { Accept: "*/*" } });

  const headers = new Headers();
  const ct = be.headers.get("content-type") ?? "application/octet-stream";
  headers.set("content-type", ct);
  const cc = be.headers.get("cache-control");
  if (cc) headers.set("cache-control", cc);

  // Copy debug headers in lowercase to avoid case/whitelist issues
  const xdp = be.headers.get("x-drive-proxy");
  if (xdp) headers.set("x-drive-proxy", xdp);
  const xus = be.headers.get("x-upstream-status");
  if (xus) headers.set("x-upstream-status", xus);

  headers.set("access-control-expose-headers", "*");

  return new Response(be.body, { status: be.status, headers });
}
