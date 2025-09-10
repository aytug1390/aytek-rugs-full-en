import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PLACEHOLDER = path.join(process.cwd(), 'public', 'placeholder.jpg');

async function placeholderResponse() {
  try {
  const buf = await fs.promises.readFile(PLACEHOLDER);
  return new NextResponse(new Uint8Array(buf), { status: 200, headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, s-maxage=3600' } });
  } catch (e) {
    return NextResponse.json({ error: 'placeholder_missing' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const sz = searchParams.get('sz') || '1600';
    if (!id) return await placeholderResponse();

    // upstream Google Drive view URL
    const upstream = `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;

    const res = await fetch(upstream, { method: 'GET' });
    if (!res.ok) {
      console.warn('[api/drive] upstream returned', res.status, 'for id', id);
      return await placeholderResponse();
    }

    // Stream the image back with the same content-type
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const body = await res.arrayBuffer();
  return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // allow browser to cache images for a short time
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('[api/drive] error', err);
    return await placeholderResponse();
  }
}
