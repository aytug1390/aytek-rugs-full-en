import { NextResponse } from 'next/server';

// Node şart değil ama tutarlı olsun
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      ts: Date.now(),
      node_env: process.env.NODE_ENV || 'development',
      version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
