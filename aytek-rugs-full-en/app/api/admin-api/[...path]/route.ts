import { NextRequest } from 'next/server'

const UPSTREAM = process.env.API_ORIGIN ?? process.env.ADMIN_API_ORIGIN ?? 'http://127.0.0.1:5000'

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const sub = params.path?.join('/') ?? '';
  const url = new URL(req.url);
  const target = `${UPSTREAM}/admin-api/${sub}${url.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: Object.fromEntries(req.headers as any),
    body: ['GET','HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: 'manual',
  };

  const res = await fetch(target, init);
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Expose-Headers', '*');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as HEAD, proxy as OPTIONS };
