import { NextRequest, NextResponse } from "next/server";

// Simple proxy for admin-app to forward to backend admin API
const API = process.env.ADMIN_API_ORIGIN || "http://127.0.0.1:5001";

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const qs = u.search ? `?${u.searchParams.toString()}` : "";
  const upstream = `${API}/admin-api/products${qs}`;
  const r = await fetch(upstream, { headers: { "x-proxy": "admin-app" } });
  return new NextResponse(r.body, { status: r.status, headers: r.headers });
}

export async function POST(req: NextRequest) {
  const u = new URL(req.url);
  const qs = u.search ? `?${u.searchParams.toString()}` : "";
  const upstream = `${API}/admin-api/products${qs}`;
  const body = await req.text();
  const r = await fetch(upstream, {
    method: "POST",
    body,
    headers: { "content-type": req.headers.get("content-type") || "application/json" },
  });
  return new NextResponse(r.body, { status: r.status, headers: r.headers });
}

export async function DELETE(req: NextRequest) {
  const u = new URL(req.url);
  const qs = u.search ? `?${u.searchParams.toString()}` : "";
  const upstream = `${API}/admin-api/products${qs}`;
  const r = await fetch(upstream, { method: "DELETE" });
  return new NextResponse(r.body, { status: r.status, headers: r.headers });
}

