import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Keep middleware minimal and Edge-compatible: only perform a presence check
// for the `admin_sess` cookie. Full verification (HMAC & expiry) runs in the
// server-side `app/admin/layout.js` where Node's crypto is available.
export const config = { matcher: ['/admin/:path*'] };

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  // Allow assets and the login page
  if (p.startsWith('/admin/login') || p.startsWith('/_next') || p.startsWith('/favicon')) return NextResponse.next();

  const token = req.cookies.get('admin_sess')?.value;
  const sessionSecret = process.env.ADMIN_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_CSRF_SECRET || '';
  if (!token) {
    // Next middleware requires absolute URLs for redirects in the Edge runtime.
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = 'from=' + encodeURIComponent(p);
  return NextResponse.redirect(url, 302);
  }
  // If no session secret is configured, legacy "ok" token is required.
  if (!sessionSecret && token !== 'ok') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = 'from=' + encodeURIComponent(p);
    return NextResponse.redirect(url, 302);
  }
  // If a session secret is configured, ensure token looks like 'payload.sig'.
  if (sessionSecret) {
    if (!token.includes('.') || token.split('.').length !== 2) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = 'from=' + encodeURIComponent(p);
      return NextResponse.redirect(url, 302);
    }
    // sanity-check signature length (HMAC-SHA256 base64url ~43-44 chars). Reject obviously short signatures.
    const sig = token.split('.')[1] || '';
    if (sig.length < 30) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = 'from=' + encodeURIComponent(p);
      return NextResponse.redirect(url, 302);
    }
  }
  return NextResponse.next();
}
