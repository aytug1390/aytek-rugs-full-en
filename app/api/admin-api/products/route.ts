import { NextRequest } from "next/server";
import { tryFetchWithRetries } from '../../../../lib/adminApiProxy';
import { jsonUtf8 } from '../../../../src/lib/responses';
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
  // Ensure default to image-bearing products unless caller explicitly opts out
  if (!upstream.searchParams.has('has_image') && !upstream.searchParams.has('include_no_image')) {
    upstream.searchParams.set('has_image', '1');
  }

  const r = await tryFetchWithRetries(upstream.toString(), { cache: "no-store" });
  if (!r.ok) {
    // If upstream explicitly reports 404, forward 404 to caller; otherwise treat as upstream error
    if (r.status === 404) return jsonUtf8({ error: 'not_found' }, { status: 404 });
    return jsonUtf8({ error: "upstream_error", status: r.status }, { status: 502 });
  }
  const data = await r.json();

  // If caller asked only for a count, upstream already handled it.
  if (upstream.searchParams.get('count_only') === '1' || upstream.searchParams.get('count_only') === 'true') {
    return jsonUtf8(data);
  }

  // Otherwise, request an authoritative total from upstream using count_only
  try {
    const countUrl = new URL(upstream.toString());
    countUrl.searchParams.set('count_only', '1');
    const cr = await tryFetchWithRetries(countUrl.toString(), { cache: 'no-store' });
    if (cr.ok) {
      const cjson = await cr.json();
      if (typeof cjson.total === 'number') data.total = cjson.total;
    }
  } catch (e) {
    // ignore count failure and return original payload
    console.warn('[proxy] count fetch failed', e && e.message ? e.message : e);
  }

  return jsonUtf8(data);
}

export async function HEAD() { return new Response(null, { status: 200 }); }
