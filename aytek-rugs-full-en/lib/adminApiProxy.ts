export function getRetryConfig() {
  const retries = Number(process.env.ADMIN_API_RETRY_COUNT ?? '5');
  const delayMs = Number(process.env.ADMIN_API_RETRY_DELAY_MS ?? '500');
  return { retries, delayMs };
}

export async function tryFetchWithRetries(url: string, options: any = {}, retries?: number, delayMs?: number) {
  const cfg = getRetryConfig();
  const maxRetries = typeof retries === 'number' ? retries : cfg.retries;
  const wait = typeof delayMs === 'number' ? delayMs : cfg.delayMs;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || attempt === maxRetries) return res;
      // retry small number of times on 404 to handle upstream eventual consistency
      if (res.status === 404) {
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      return res;
    } catch (e) {
      // Network or connection errors (ECONNREFUSED, DNS failures, etc.) should
      // be surfaced quickly as 502 rather than retried. Retries are useful for
      // eventual-consistency 404s, not for unreachable backends.
      try { console.error('[proxy] fetch error', url, e && (e as any).message ? (e as any).message : e); } catch (_) {}
  return new Response(JSON.stringify({ ok: false, error: 'backend_unreachable', message: String(e) }), { status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8' } }) as any;
    }
  }
  // Shouldn't reach here
  return new Response(null, { status: 502 }) as any;
}
