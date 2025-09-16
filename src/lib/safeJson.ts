export async function safeJson<T = any>(res: Response, fallback: T): Promise<T> {
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
