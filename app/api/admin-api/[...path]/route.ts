import { NextRequest, NextResponse } from 'next/server';

const ORIGIN = process.env.ADMIN_API_ORIGIN || 'http://127.0.0.1:5000';

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
    const r = await fetch(target, init);
    return new NextResponse(r.body, { status: r.status, headers: r.headers });
  } catch {
    return NextResponse.json(
      { error: 'backend_unreachable', message: 'Admin API is not available' },
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
