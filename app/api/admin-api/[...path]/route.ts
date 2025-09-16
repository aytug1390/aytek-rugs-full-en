import { NextRequest, NextResponse } from 'next/server';
import { tryFetchWithRetries } from '../../../../lib/adminApiProxy';

// Debug: print the configured admin API origin at module load so the running
// Next process shows which upstream it's configured to use. This helps when
// multiple .env files exist in a monorepo and the running server may pick a
// different one than expected.
  try {
    // Intentionally defensive — don't throw if env access fails for any reason.
    // Keep output concise.
    console.log('[admin-proxy] env ADMIN_API_ORIGIN=', process.env.ADMIN_API_ORIGIN, 'API_ORIGIN=', process.env.API_ORIGIN, 'API_BASE=', process.env.API_BASE);
  } catch (_) {
    // ignore
  }

// Prefer explicit env; fall back to local API port 5001 used by the dev API server.
const ORIGIN = process.env.ADMIN_API_ORIGIN || process.env.API_ORIGIN || 'http://127.0.0.1:5001';

function isHealth(u: URL) {
  return /\/api\/admin-api\/_health(?:\/|$)/.test(u.pathname);
}

async function forward(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
  method: string
) {
  const url = new URL(req.url);

  // Sağlık kontrolünü asla proxy etme; lokal dön
  if (isHealth(url)) {
    return NextResponse.json({ ok: true });
  }

  const { path = [] } = await ctx.params; // Next 15: params async
  const rest = Array.isArray(path) ? path.join('/') : '';
  const target = `${ORIGIN}/admin-api/${rest}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  const init: RequestInit = { method, headers, redirect: 'manual' };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  try {
    const r = await tryFetchWithRetries(target, init);
    // Forward upstream status and headers/body
    return new NextResponse(r.body, { status: r.status, headers: r.headers });
  } catch (e) {
    return NextResponse.json(
      { error: 'backend_unreachable', message: 'Admin API is not available', detail: e && e.message ? e.message : undefined },
      { status: 502 }
    );
  }
}

export const GET    = (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => forward(req, ctx, 'GET');
export const HEAD   = (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => forward(req, ctx, 'HEAD');
export const POST   = (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => forward(req, ctx, 'POST');
export const PUT    = (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => forward(req, ctx, 'PUT');
export const PATCH  = (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => forward(req, ctx, 'PATCH');
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => forward(req, ctx, 'DELETE');
