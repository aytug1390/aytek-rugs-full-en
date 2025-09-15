export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from 'crypto';
import { jsonUtf8 } from '@/lib/responses';
// Optional Redis client for rate-limiting
let Redis: any = null;
let redisClient: any = null;
const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
if (REDIS_URL) {
  try {
    Redis = require('ioredis');
    redisClient = new Redis(REDIS_URL);
  } catch (e) {
    redisClient = null;
  }
}
let bcrypt: any = null;
try { bcrypt = require('bcryptjs'); } catch (e) { bcrypt = null; }

// Simple in-memory rate limiter (per-IP). For production use replace with
// Redis or another shared store so limits persist across instances.
const rateMap: Map<string, { attempts: number; firstAt: number }> = new Map();
const MAX_ATTEMPTS = Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS ?? '10');
const WINDOW_MS = Number(process.env.ADMIN_LOGIN_WINDOW_MS ?? String(60 * 60 * 1000)); // 1h default

function ipKey(req: NextRequest) {
  try {
    return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || new URL(req.url).hostname || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

async function incrementRate(req: NextRequest) {
  const k = ipKey(req);
  // If redisClient available use Redis-based counter (sliding window per WINDOW_MS)
  if (redisClient) {
    try {
      const key = `admin:rl:${k}`;
      const now = Date.now();
      const window = WINDOW_MS;
      const max = MAX_ATTEMPTS;
      const tx = redisClient.multi();
      tx.incr(key);
      tx.pttl(key);
      const [count, ttl] = await tx.exec().then((res: any) => res.map((r: any) => r[1]));
      if (ttl === -1) {
        await redisClient.pexpire(key, window);
      }
      if (Number(count) > max) {
        const retryAfter = Math.ceil((await redisClient.pttl(key)) / 1000);
        return { ok: false, retryAfter };
      }
      return { ok: true };
    } catch (e) {
      // Redis failed - fallback to in-memory
    }
  }

  // Fallback to in-memory limiter
  const k2 = ipKey(req);
  const now = Date.now();
  const e = rateMap.get(k2);
  if (!e) {
    rateMap.set(k2, { attempts: 1, firstAt: now });
    return { ok: true };
  }
  if (now - e.firstAt > WINDOW_MS) {
    rateMap.set(k2, { attempts: 1, firstAt: now });
    return { ok: true };
  }
  e.attempts++;
  rateMap.set(k2, e);
  if (e.attempts > MAX_ATTEMPTS) return { ok: false, retryAfter: Math.ceil((e.firstAt + WINDOW_MS - now) / 1000) };
  return { ok: true };
}

function computeSecure(h: Headers, req: NextRequest): boolean {
  const allow = process.env.ALLOW_INSECURE_COOKIE === "1" || process.env.ALLOW_INSECURE_COOKIE?.toLowerCase() === "true";
  if (allow) return false;
  const proto = (h.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "") || "http").toString();
  const host  = (h.get("host") || new URL(req.url).host || "").toLowerCase();
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]") || host.startsWith("::1");
  return !isLocalhost && proto === "https";
}

// Helper: Verify password against ADMIN_PASSWORD_HASH (bcrypt). Fallback to
// legacy ADMIN_PASSWORD env if no hash is provided (for backward compat).
async function verifyPassword(raw: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    try { return await bcrypt.compare(raw, hash); } catch (e) { return false; }
  }
  const legacy = process.env.ADMIN_PASSWORD || 'AytekAdmin2025!';
  return raw === legacy;
}

// Simple CSRF double-submit token: we expose a GET endpoint that sets a cookie
// `admin_csrf` and returns the token. The login POST must include the same token
// in a body field `csrf` (double-submit cookie pattern). Token lifetime is short.
export async function GET() {
  // If ADMIN_CSRF_SECRET is set, issue a signed token: base64(nonce|hmac)
  const secret = process.env.ADMIN_CSRF_SECRET;
  const secure = computeSecure(headers() as unknown as Headers, { url: '' } as NextRequest);
  if (secret) {
    const nonce = crypto.randomBytes(12).toString('base64').replace(/=+$/,'');
    const expires = Date.now() + 1000 * 60 * 5; // 5 minutes
    const payload = `${nonce}:${expires}`;
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('base64').replace(/=+$/,'');
    const token = Buffer.from(`${payload}:${hmac}`).toString('base64');
    const res = NextResponse.json(
      { csrf: token },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
    res.cookies.set('admin_csrf', token, { httpOnly: false, sameSite: 'lax', secure, path: '/', maxAge: 60 * 5 });
    return res;
  }

  // Fallback: unsigned random token
  const token = (Math.random().toString(36).slice(2, 12));
  const res = NextResponse.json(
    { csrf: token },
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
  res.cookies.set('admin_csrf', token, { httpOnly: false, sameSite: 'lax', secure, path: '/', maxAge: 60 * 5 });
  return res;
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  let password = "", from = "", csrf = "";

  // Rate-limit by IP (Redis if configured)
  const rate = await incrementRate(req);
  if (!rate.ok) return jsonUtf8({ error: 'too_many_requests' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter || 60) } });

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({} as any));
    password = body?.password ?? "";
    from     = body?.from ?? "";
    csrf     = body?.csrf ?? "";
  } else if (ct.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    password = String(form.get("password") ?? "");
    from     = String(form.get("from") ?? "");
    csrf     = String(form.get("csrf") ?? "");
  } else {
    return jsonUtf8({ error: "Unsupported Media Type" }, { status: 415 });
  }

  // Validate CSRF double-submit token. If ADMIN_CSRF_SECRET is set we expect a
  // signed token: base64(nonce:expires:hmac). Verify HMAC and expiry.
  const cookieToken = req.cookies.get('admin_csrf')?.value || '';
  const secret = process.env.ADMIN_CSRF_SECRET;
  if (!csrf || !cookieToken) {
    return jsonUtf8({ error: 'invalid_csrf' }, { status: 403 });
  }
  if (secret) {
    try {
      const decoded = Buffer.from(csrf, 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 3) throw new Error('bad_token');
      const [nonce, expiresStr, hmac] = parts;
      const payload = `${nonce}:${expiresStr}`;
      const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('base64').replace(/=+$/,'');
      if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) throw new Error('bad_hmac');
      const expires = Number(expiresStr);
      if (Date.now() > expires) throw new Error('expired');
      // Also check cookie matches the token (double-submit)
      if (cookieToken !== csrf) throw new Error('mismatch');
    } catch (e) {
  return jsonUtf8({ error: 'invalid_csrf' }, { status: 403 });
    }
  } else {
    // Fallback unsigned token: exact match required
  if (csrf !== cookieToken) return jsonUtf8({ error: 'invalid_csrf' }, { status: 403 });
  }

  const ok = await verifyPassword(password);
  if (!ok) return jsonUtf8({ error: "Unauthorized" }, { status: 401 });

  const h = await headers();
  const secure = computeSecure(h as unknown as Headers, req);
  const proto  = (h.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "")).toString();
  const host   = (h.get("host") || new URL(req.url).host).toString();

  const to = typeof from === "string" && from.startsWith("/admin") ? from : "/admin";
  const res = NextResponse.redirect(new URL(to, req.url), { status: 307 });

  // Set stricter cookie flags. Domain and SameSite can be configured via env
  const cookieDomain = process.env.ADMIN_COOKIE_DOMAIN || undefined;
  const sameSiteEnv = (process.env.ADMIN_COOKIE_SAMESITE || 'Strict');
  const sameSite = (sameSiteEnv || 'Strict').toLowerCase() as 'lax' | 'strict' | 'none';
  const httpOnly = true;
  const secureFlag = secure;

  res.cookies.set({ name: 'admin_sess', value: 'ok' });
  // Use NextResponse.cookies.set overload: set(name, value, options)
  // Create a stateless HMAC-signed session token
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_CSRF_SECRET || '';
  const iat = Math.floor(Date.now() / 1000);
  const maxAgeSec = Number(process.env.ADMIN_SESSION_MAX_AGE ?? String(60 * 60 * 8));
  const exp = iat + maxAgeSec;
  const payloadObj = { sub: 'admin', iat, exp };
  let sessionValue = 'ok';
  if (sessionSecret) {
    const payloadStr = JSON.stringify(payloadObj);
    const h = crypto.createHmac('sha256', sessionSecret).update(payloadStr).digest('base64').replace(/=+$/,'');
    sessionValue = Buffer.from(`${payloadStr}:${h}`).toString('base64');
  }

  res.cookies.set(
    'admin_sess',
    sessionValue,
    {
      httpOnly,
      sameSite,
      secure: secureFlag,
      domain: cookieDomain,
      path: '/',
      maxAge: maxAgeSec,
    }
  );

  // Clear CSRF cookie after successful login
  res.cookies.set('admin_csrf', '', { httpOnly: false, sameSite: 'lax', secure: secureFlag, path: '/', maxAge: 0 });

  // Debug headers
  res.headers.set("x-login-secure", String(secure));
  res.headers.set("x-login-proto", proto);
  res.headers.set("x-login-host", host);

  return res;
}
