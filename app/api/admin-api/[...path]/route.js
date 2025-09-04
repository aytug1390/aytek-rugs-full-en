import http from 'http';

const BACKEND = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:5000';

export async function GET(req, { params }) {
  const path = params.path ? params.path.join('/') : '';
  const url = `${BACKEND}/admin-api/${path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    const body = await res.arrayBuffer();
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html') && res.status >= 400) {
      return new Response(JSON.stringify({ error: 'backend_error_html', status: res.status, message: 'Backend returned HTML' }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(body, { status: res.status, headers: res.headers });
  } catch (e) {
    // Backend unreachable — return a graceful 502
    return new Response(JSON.stringify({ error: 'backend_unreachable', message: 'Admin API is not available' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(req, { params }) {
  const path = params.path ? params.path.join('/') : '';
  const url = `${BACKEND}/admin-api/${path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
  try {
    const body = await req.arrayBuffer();
    const res = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': req.headers.get('content-type') || 'application/octet-stream' } });
    const respBody = await res.arrayBuffer();
    return new Response(respBody, { status: res.status, headers: res.headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'backend_unreachable', message: 'Admin API is not available' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PUT(req, { params }) {
  const path = params.path ? params.path.join('/') : '';
  const url = `${BACKEND}/admin-api/${path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
  try {
    const body = await req.arrayBuffer();
    const res = await fetch(url, { method: 'PUT', body, headers: { 'Content-Type': req.headers.get('content-type') || 'application/octet-stream' } });
    const respBody = await res.arrayBuffer();
    return new Response(respBody, { status: res.status, headers: res.headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'backend_unreachable', message: 'Admin API is not available' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(req, { params }) {
  const path = params.path ? params.path.join('/') : '';
  const url = `${BACKEND}/admin-api/${path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const respBody = await res.arrayBuffer();
    return new Response(respBody, { status: res.status, headers: res.headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'backend_unreachable', message: 'Admin API is not available' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PATCH(req, { params }) {
  const path = params.path ? params.path.join('/') : '';
  const url = `${BACKEND}/admin-api/${path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
  try {
    const body = await req.arrayBuffer();
    const res = await fetch(url, { method: 'PATCH', body, headers: { 'Content-Type': req.headers.get('content-type') || 'application/octet-stream' } });
    const respBody = await res.arrayBuffer();
    return new Response(respBody, { status: res.status, headers: res.headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'backend_unreachable', message: 'Admin API is not available' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function OPTIONS(req, { params }) {
  const path = params.path ? params.path.join('/') : '';
  const url = `${BACKEND}/admin-api/${path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
  try {
    const res = await fetch(url, { method: 'OPTIONS' });
    const respBody = await res.arrayBuffer();
    return new Response(respBody, { status: res.status, headers: res.headers });
  } catch (e) {
    return new Response(null, { status: 204 });
  }
}
