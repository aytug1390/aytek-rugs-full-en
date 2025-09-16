#!/usr/bin/env node
// Smoke test: GET CSRF, POST login, verify /admin returns 200
const fetch = globalThis.fetch || require('node:fetch').fetch;

const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || '';
if (!ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD (or TEST_ADMIN_PASSWORD) must be set for smoke-login');
  process.exit(2);
}

function parseSetCookie(setCookieHeader) {
  if (!setCookieHeader) return [];
  // naive split: split on comma only when it looks like cookie separators
  // Many servers send single Set-Cookie headers; for simplicity, split on '\n' or ', ' heuristically
  return setCookieHeader.split(/, (?=[^;]+=)/g).map(s => s.split(';')[0].trim()).filter(Boolean);
}

function addCookies(cookieJar, setCookieHeader) {
  const parts = parseSetCookie(setCookieHeader);
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k && v !== undefined) cookieJar[k] = v;
  }
}

function cookieHeader(cookieJar) {
  return Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function main() {
  try {
    const cookieJar = {};

    // 1) GET CSRF
    const getRes = await fetch(`${APP_URL}/api/admin-login`, { method: 'GET', redirect: 'follow' });
    if (!getRes.ok) {
      console.error('GET /api/admin-login failed', getRes.status);
      process.exit(3);
    }
    const body = await getRes.json();
    const csrf = body?.csrf;
    addCookies(cookieJar, getRes.headers.get('set-cookie'));
    if (!csrf) {
      console.error('CSRF token not returned');
      process.exit(4);
    }

    // 2) POST login (capture redirect Set-Cookie)
    const form = new URLSearchParams({ password: ADMIN_PASSWORD, csrf }).toString();
    const postRes = await fetch(`${APP_URL}/api/admin-login`, {
      method: 'POST',
      body: form,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader(cookieJar),
      },
      redirect: 'manual',
    });

    const sc = postRes.headers.get('set-cookie');
    addCookies(cookieJar, sc);

    if (postRes.status !== 302 && postRes.status !== 200) {
      console.error('Login POST did not redirect or succeed. Status:', postRes.status);
      console.error('Body:', await postRes.text());
      process.exit(5);
    }

    if (!cookieJar['admin_sess']) {
      console.error('No admin_sess cookie set after login POST');
      process.exit(6);
    }

    // 3) Fetch /admin with cookie
    const adminRes = await fetch(`${APP_URL}/admin`, {
      method: 'GET',
      headers: { 'Cookie': cookieHeader(cookieJar) },
      redirect: 'follow',
    });

    if (adminRes.status === 200) {
      console.log('SMOKE OK: /admin returned 200');
      process.exit(0);
    } else {
      console.error('SMOKE FAIL: /admin did not return 200, status=', adminRes.status);
      const t = await adminRes.text();
      console.error('Response body (truncated):', t.slice(0, 2000));
      process.exit(7);
    }
  } catch (e) {
    console.error('Error in smoke-login:', e);
    process.exit(10);
  }
}

main();
