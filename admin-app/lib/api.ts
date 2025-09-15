export async function api(path: string, init?: RequestInit) {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const r = await fetch(base + path, {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers || {})
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r;
}
