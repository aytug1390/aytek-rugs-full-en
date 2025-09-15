// src/lib/responses.js
export function jsonUtf8(data, init) {
  const base = {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  };
  const merged = {
    ...base,
    ...init,
    headers: { ...(base.headers || {}), ...((init && init.headers) || {}) },
  };
  return new Response(JSON.stringify(data), merged);
}

export function errorJsonUtf8(message, status = 400, extra = {}) {
  const body = { ok: false, error: String(message), ...extra };
  return jsonUtf8(body, { status });
}

export function okJsonUtf8(data = {}) {
  return jsonUtf8({ ok: true, ...data });
}
