import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:5000';

async function proxy(method, req) {
  const url = `${BACKEND}/admin-api/${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
  try {
    const init = { method, headers: {} };
    if (method !== 'GET' && method !== 'OPTIONS' && method !== 'DELETE') {
      const body = await req.arrayBuffer();
      init.body = body;
      init.headers['Content-Type'] = req.headers.get('content-type') || 'application/octet-stream';
    }
    const res = await fetch(url, init);
    const buf = await res.arrayBuffer();
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html') && res.status >= 400) {
      const jsonBody = JSON.stringify({ error: 'backend_error_html', status: res.status, message: 'Backend returned HTML error' });
      return new Response(jsonBody, { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(buf, { status: res.status, headers: res.headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'backend_unreachable', message: 'Admin API is not available' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function GET(req) {
  return proxy('GET', req);
}

export async function POST(req) {
  return proxy('POST', req);
}

export async function OPTIONS(req) {
  return proxy('OPTIONS', req);
}

export async function PUT(req) {
  return proxy('PUT', req);
}

export async function DELETE(req) {
  return proxy('DELETE', req);
}
