import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// Prefer explicit env, but during local development force the local admin API to avoid
// accidentally proxying to a remote/stale backend. Remove this override when debugging is done.
const API_BASE = process.env.API_BASE || process.env.ADMIN_API_ORIGIN || "http://127.0.0.1:5000";

export async function GET(req: NextRequest) {
  // Use req.nextUrl to safely access incoming searchParams (handles relative URLs)
  const incoming = req.nextUrl;
  const upstream = new URL(`${API_BASE}/admin-api/products`);
  incoming.searchParams.forEach((value, key) => upstream.searchParams.set(key, value));

  // Ensure public listing defaults: only active, public products unless caller overrides
  if (!upstream.searchParams.has('status')) upstream.searchParams.set('status', 'active');
  if (!upstream.searchParams.has('visibility')) upstream.searchParams.set('visibility', 'public');

  const r = await fetch(upstream.toString(), { cache: "no-store" });
  if (!r.ok) {
    return NextResponse.json({ error: "upstream_error", status: r.status }, { status: 502 });
  }
  const data = await r.json();
  return NextResponse.json(data);
}

export async function HEAD() { return new Response(null, { status: 200 }); }
