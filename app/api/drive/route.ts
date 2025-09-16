export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const PLACEHOLDER = '/img/placeholder.svg';
const PLACEHOLDER_PATH = join(process.cwd(), 'public', 'img', 'placeholder.svg');

function normalizeDriveUrl(raw: string) {
  try {
    const u = new URL(raw);
    // drive.usercontent.google.com/download?id=... -> uc?id=...&export=view
    if (u.hostname === 'drive.usercontent.google.com') {
      if (u.pathname === '/download' && u.searchParams.has('id')) {
        const id = u.searchParams.get('id')!;
        return `https://drive.usercontent.google.com/uc?id=${id}&export=view`;
      }
    }
    // drive.google.com/uc?id=... -> drive.usercontent.google.com/uc?id=...&export=view
    if (u.hostname === 'drive.google.com') {
      if (u.pathname === '/uc' && u.searchParams.has('id')) {
        const id = u.searchParams.get('id')!;
        return `https://drive.usercontent.google.com/uc?id=${id}&export=view`;
      }
    }
    return raw;
  } catch {
    return raw;
  }
}

async function handle(url: string, req: Request, method: 'GET' | 'HEAD') {
  const target = normalizeDriveUrl(url);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers: {
        Accept: 'image/*,*/*;q=0.8',
        Referer: 'https://drive.google.com',
        'User-Agent': req.headers.get('user-agent') ?? 'AytekRugs/1.0',
        ...(req.headers.get('if-modified-since')
          ? { 'If-Modified-Since': req.headers.get('if-modified-since')! }
          : {}),
        ...(req.headers.get('if-none-match')
          ? { 'If-None-Match': req.headers.get('if-none-match')! }
          : {}),
      },
      redirect: 'follow',
      cache: 'no-store',
    });
  } catch (err: any) {
    // Network errors, DNS failures, invalid URL etc. — return placeholder body
    console.error('[api/drive] fetch error for', target, err?.message || err);
    try {
      const buf = await readFile(PLACEHOLDER_PATH);
      const headers = new Headers({ 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=3600' });
  // convert Buffer to ArrayBuffer for Web Response body
  const view = new Uint8Array(buf);
  return new NextResponse(view, { status: 200, headers });
    } catch (e: any) {
      console.error('[api/drive] failed to read placeholder', e?.message || e);
      return NextResponse.json({ error: 'upstream fetch error' }, { status: 502 });
    }
  }

  if (upstream.status === 304) {
    return new NextResponse(null, { status: 304 });
  }

  if (upstream.ok) {
    const h = new Headers();
    const ct = upstream.headers.get('content-type');
    if (ct) h.set('content-type', ct);
    const cl = upstream.headers.get('content-length');
    if (cl) h.set('content-length', cl);
    const etag = upstream.headers.get('etag');
    if (etag) h.set('etag', etag);
    const lm = upstream.headers.get('last-modified');
    if (lm) h.set('last-modified', lm);
    h.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    h.set('X-Proxy-Source', new URL(target).hostname);

    if (method === 'HEAD') return new NextResponse(null, { status: 200, headers: h });
    return new NextResponse(upstream.body, { status: 200, headers: h });
  }

  // 4xx/5xx: return placeholder body instead of redirecting (avoid cross-origin redirect/CORB)
  console.error('[api/drive] upstream not ok for', target, 'status', upstream.status);
  try {
    const buf = await readFile(PLACEHOLDER_PATH);
    const headers2 = new Headers({ 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=3600' });
  const view2 = new Uint8Array(buf);
  return new NextResponse(view2, { status: 200, headers: headers2 });
  } catch (e: any) {
    console.error('[api/drive] failed to read placeholder', e?.message || e);
    return NextResponse.json({ error: 'upstream not ok' }, { status: 502 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });
  return handle(url, req, 'GET');
}

export async function HEAD(req: Request) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) return new NextResponse(null, { status: 400 });
  return handle(url, req, 'HEAD');
}
