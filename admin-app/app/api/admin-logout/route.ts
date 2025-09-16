import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.ADMIN_COOKIE_DOMAIN || '';
  const sameSite = isProd ? 'Strict' : 'Lax';
  const secureFlag = (process.env.APP_URL?.startsWith?.('https://') || isProd) ? 'Secure; ' : '';
  const domainAttr = cookieDomain ? `Domain=${cookieDomain}; ` : '';
  const COOKIE = process.env.COOKIE_NAME || 'admin_sess';
  const APP_URL = process.env.APP_URL || 'http://localhost:3001';

  const res = NextResponse.redirect(`${APP_URL}/admin/login`, 302);
  res.headers.set(
    'Set-Cookie',
    `${COOKIE}=; Path=/; ${domainAttr}HttpOnly; ${secureFlag}SameSite=${sameSite}; Expires=${new Date(0).toUTCString()}`
  );
  return res;
}
