export function jsonUtf8(data: unknown, init?: ResponseInit) {
  const base = {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  } as ResponseInit;
  const merged: ResponseInit = {
    ...base,
    ...init,
    headers: { ...(base.headers as any), ...(init?.headers || {}) },
  };
  return new Response(JSON.stringify(data), merged);
}
