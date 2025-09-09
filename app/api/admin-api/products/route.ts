import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const API_BASE = process.env.API_BASE || "http://localhost:5000";

export async function GET(req: NextRequest) {
  const url   = new URL(req.url);
  const limit = url.searchParams.get("limit") ?? "24";
  const page  = url.searchParams.get("page")  ?? "1";

  // Express list endpoint’ine proxy
  const r = await fetch(`${API_BASE}/admin-api/products?limit=${limit}&page=${page}`, { cache: "no-store" });
  if (!r.ok) {
    return NextResponse.json({ error: "upstream_error", status: r.status }, { status: 502 });
  }
  const data = await r.json();
  return NextResponse.json(data);
}

export async function HEAD() { return new Response(null, { status: 200 }); }
