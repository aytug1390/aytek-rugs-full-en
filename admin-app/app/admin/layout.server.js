import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function b64ud(s) {
  // base64url -> base64
  return s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
}

export default function AdminLayout({ children }) {
  const token = cookies().get('admin_sess')?.value;
  const sessionSecret = process.env.ADMIN_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_CSRF_SECRET || '';
  if (!token) {
    redirect('/admin/login');
  }
  if (sessionSecret) {
    try {
      const [b64payload, b64sig] = token.split('.');
      if (!b64payload || !b64sig) throw new Error('bad');
      const payloadStr = Buffer.from(b64ud(b64payload), 'base64').toString('utf8');
      const sig = Buffer.from(b64ud(b64sig), 'base64');
      const expected = crypto.createHmac('sha256', sessionSecret).update(b64payload).digest();
      if (!crypto.timingSafeEqual(sig, expected)) throw new Error('bad');
      const payload = JSON.parse(payloadStr);
      const now = Date.now();
      const skew = Number(process.env.ADMIN_CLOCK_SKEW_MS ?? String(60 * 1000));
      if (!payload || payload.sub !== 'admin' || payload.exp + skew < now) throw new Error('bad');
    } catch (e) {
      redirect('/admin/login');
    }
  } else {
    if (token !== 'ok') redirect('/admin/login');
  }

  return (
    <>
      {children}
    </>
  );
}
