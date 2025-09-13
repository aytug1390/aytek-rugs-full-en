import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

function b64u(buf: Buffer | string) {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf;
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const COOKIE = process.env.COOKIE_NAME || 'admin_sess';
const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const RATE_LIMIT_MAX = Number(process.env.ADMIN_RATE_LIMIT_MAX ?? '5');
const RATE_LIMIT_WINDOW_SEC = Number(process.env.ADMIN_RATE_LIMIT_WINDOW_SEC ?? String(5 * 60));

// Redis (Upstash) if configured, otherwise fall back to in-memory Map.
let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, { enableOfflineQueue: false });
  } catch (e) {
    // ignore and fall back
    redisClient = null;
  }
}

const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function verifyHmac(token: string) {
  if (!ADMIN_SECRET) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  try {
    const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(payloadB64).digest();
    const provided = Buffer.from(sigB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (provided.length !== expected.length) return false;
    return crypto.timingSafeEqual(provided, expected);
  } catch (e) {
    return false;
  }
}

export async function GET() {
  // CSRF token: we keep the existing behavior (signed when secret present)
  const secret = process.env.ADMIN_CSRF_SECRET;
  const secure = !(process.env.ALLOW_INSECURE_COOKIE === '1' || (process.env.ALLOW_INSECURE_COOKIE || '').toLowerCase() === 'true');
  if (secret) {
    const nonce = crypto.randomBytes(12).toString('base64').replace(/=+$/,'');
    const expires = Date.now() + 1000 * 60 * 5;
    const payload = `${nonce}:${expires}`;
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest();
    const token = b64u(payload) + '.' + b64u(hmac);
    const res = NextResponse.json({ csrf: token });
    res.cookies.set({ name: 'admin_csrf', value: token, httpOnly: false, sameSite: 'lax', secure, path: '/', maxAge: 60 * 5 });
    return res;
  }
  const token = (Math.random().toString(36).slice(2, 12));
  const res = NextResponse.json({ csrf: token });
  res.cookies.set({ name: 'admin_csrf', value: token, httpOnly: false, sameSite: 'lax', secure, path: '/', maxAge: 60 * 5 });
  return res;
}

export async function POST(req: Request) {
  // Idempotent: if a valid session cookie already exists, redirect to /admin
  try {
    const cs = await cookies();
    const existing = cs.get(COOKIE)?.value || null;
    if (existing && verifyHmac(existing)) {
      return NextResponse.redirect(`${APP_URL}/admin`, 302);
    }
  } catch (e) {
    // ignore cookie failures and continue with normal login flow
  }
  const body = await req.formData();
  const password = String(body.get('password') || '');
  const csrf = String(body.get('csrf') || '');
  const cookieToken = (req as any).cookies?.get?.('admin_csrf')?.value || '';
  if (!csrf || !cookieToken || csrf !== cookieToken) return NextResponse.json({ error: 'invalid_csrf' }, { status: 403 });

  // Rate limiting: key by IP + username (username is fixed 'admin' here) to be conservative
  const forwarded = (req.headers.get('x-forwarded-for') || '').split(',').map(s => s.trim()).filter(Boolean)[0];
  const remoteIp = forwarded || req.headers.get('x-real-ip') || 'unknown';
  const userKey = 'admin';
  const rateKey = `rl:${remoteIp}:${userKey}`;

  async function getAndIncr(key: string) {
    if (redisClient) {
      try {
        const ttl = await redisClient.ttl(key);
        const val = await redisClient.incr(key);
        if (val === 1) {
          await redisClient.expire(key, RATE_LIMIT_WINDOW_SEC);
        }
        return { count: Number(val), ttl };
      } catch (e) {
        // fallback to in-memory
      }
    }
    const now = Date.now();
    const entry = inMemoryStore.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_SEC * 1000 };
    entry.count += 1;
    inMemoryStore.set(key, entry);
    if (entry.resetAt < now) {
      entry.count = 1;
      entry.resetAt = now + RATE_LIMIT_WINDOW_SEC * 1000;
    }
    return { count: entry.count, ttl: Math.ceil((entry.resetAt - now) / 1000) };
  }

  const rl = await getAndIncr(rateKey);
  if (rl.count > RATE_LIMIT_MAX) {
    return NextResponse.json({ error: 'rate_limited', retryAfter: rl.ttl }, { status: 429, headers: { 'Retry-After': String(rl.ttl) } });
  }

  // Dummy verify - in real admin-app set ADMIN_PASSWORD_HASH
  const legacy = process.env.ADMIN_PASSWORD || 'AytekAdmin2025!';
  if (password !== legacy) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = Date.now();
  const maxAgeMs = Number(process.env.ADMIN_SESSION_MAX_AGE ?? String(60 * 60 * 8)) * 1000;
  const exp = now + maxAgeMs;
  const payloadObj = { sub: 'admin', ts: now, exp };
  const payloadStr = JSON.stringify(payloadObj);
  const sessionSecret = process.env.ADMIN_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_CSRF_SECRET || '';
  let sessionValue = 'ok';
  if (sessionSecret) {
    const sig = crypto.createHmac('sha256', sessionSecret).update(b64u(payloadStr)).digest();
    sessionValue = b64u(payloadStr) + '.' + b64u(sig);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.ADMIN_COOKIE_DOMAIN || '';
  const sameSite = isProd ? 'Strict' : 'Lax';
  const secureFlag = (APP_URL?.startsWith?.('https://') || isProd) ? 'Secure; ' : '';
  const domainAttr = cookieDomain ? `Domain=${cookieDomain}; ` : '';

  const expDate = new Date(exp).toUTCString();

  const res = NextResponse.redirect(`${APP_URL}/admin`, 302);
  res.headers.set(
    'Set-Cookie',
    `${COOKIE}=${sessionValue}; Path=/; ${domainAttr}HttpOnly; ${secureFlag}SameSite=${sameSite}; Expires=${expDate}`
  );
  return res;
}
