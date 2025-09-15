export function getRetryConfig() {
  const retries = Number(process.env.ADMIN_API_RETRY_COUNT ?? '2');
  const delayMs = Number(process.env.ADMIN_API_RETRY_DELAY_MS ?? '200');
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
      if (attempt === maxRetries) throw e;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  // Shouldn't reach here
  return new Response(null, { status: 502, headers: { 'X-Content-Type-Options': 'nosniff' } }) as any;
}
