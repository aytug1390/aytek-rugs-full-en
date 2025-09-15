import { NextRequest, NextResponse } from "next/server";
import { jsonUtf8 } from '@/lib/responses';
import { tryFetchWithRetries } from '../../../../lib/adminApiProxy';
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

  // Debug: log the exact upstream URL we will call (helps track param forwarding)
  try {
    // Only log in non-production to avoid leaking querystrings in prod logs
    if (process.env.NODE_ENV !== 'production') console.log('[proxy] forwarding to upstream:', upstream.toString());
  } catch (e) {}

  const r = await tryFetchWithRetries(upstream.toString(), { cache: "no-store" });
  if (!r.ok) {
    // If upstream explicitly reports 404, forward 404 to caller; otherwise treat as upstream error
    if (r.status === 404) return jsonUtf8({ error: 'not_found' }, { status: 404 });
    return jsonUtf8({ error: "upstream_error", status: r.status }, { status: 502 });
  }
  const data = await r.json();
  // Capture upstream debug headers so we can forward them to the client
  const upstreamHeaders = {
    'x-search-used': r.headers.get('x-search-used') || undefined,
    'x-search-mode': r.headers.get('x-search-mode') || undefined,
    'x-applied-filters': r.headers.get('x-applied-filters') || undefined,
  };

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

  // Use jsonUtf8 to ensure consistent Content-Type + nosniff headers.
  const baseRes = jsonUtf8(data);
  // jsonUtf8 returns a Response; create a new Response so we can set/forward headers
  const res = new Response(baseRes.body, { status: baseRes.status, headers: baseRes.headers });
  // Forward any upstream debug headers if present
  if (upstreamHeaders['x-search-used']) res.headers.set('x-search-used', upstreamHeaders['x-search-used']);
  if (upstreamHeaders['x-search-mode']) res.headers.set('x-search-mode', upstreamHeaders['x-search-mode']);
  if (upstreamHeaders['x-applied-filters']) res.headers.set('x-applied-filters', upstreamHeaders['x-applied-filters']);
  // Ensure the browser can see these custom headers — merge with existing value
  const existingExpose = res.headers.get('Access-Control-Expose-Headers') || '';
  const needed = 'x-search-used,x-search-mode,x-applied-filters';
  const merged = existingExpose
    ? Array.from(new Set(existingExpose.split(',').map(s => s.trim()).filter(Boolean).concat(needed.split(',').map(s => s.trim())))).join(',')
    : needed;
  res.headers.set('Access-Control-Expose-Headers', merged);
  return res;
}

export async function HEAD() { return new Response(null, { status: 200 }); }
