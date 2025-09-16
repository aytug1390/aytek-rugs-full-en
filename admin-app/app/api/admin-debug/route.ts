import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

function devEnabled() {
  // Only enable when explicitly development or ADMIN_DEBUG=1
  return (process.env.NODE_ENV === 'development') || (process.env.ADMIN_DEBUG === '1');
}

export async function GET() {
  if (!devEnabled()) {
    // Return 404 in production unless ADMIN_DEBUG is set. Keep payload minimal.
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const cs = await cookies();
  const token = cs.get('admin_sess')?.value || null;
  const sessionSecret = process.env.ADMIN_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_CSRF_SECRET || '';
  return NextResponse.json({ token, hasSessionSecret: !!sessionSecret, detectedSecrets: { ADMIN_SECRET: !!process.env.ADMIN_SECRET, ADMIN_SESSION_SECRET: !!process.env.ADMIN_SESSION_SECRET, ADMIN_CSRF_SECRET: !!process.env.ADMIN_CSRF_SECRET } });
}
