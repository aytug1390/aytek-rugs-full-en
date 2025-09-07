export const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#f2f2f2"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#999">No Image</text>
    </svg>`
  );

export function extractDriveId(input?: string | null): string | null {
  if (!input) return null;
  if (/^[\w-]{20,}$/.test(input)) return input;
  try {
    const u = new URL(input);
    const q = u.searchParams.get('id');
    if (q) return q;
    const m =
      u.pathname.match(/\/file\/d\/([\w-]+)/) ||
      u.pathname.match(/\/d\/([\w-]+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

export function buildDriveCandidates(src?: string | null): string[] {
  const id = extractDriveId(src);
  const list: string[] = [];
  if (src) list.push(src);
  if (id) {
    list.push(`https://drive.google.com/thumbnail?id=${id}&sz=w1200`);
    list.push(`https://lh3.googleusercontent.com/d/${id}=w1200`);
  }
  list.push(PLACEHOLDER);
  return Array.from(new Set(list));
}

export function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget as HTMLImageElement & { dataset: any };
  let pool: string[] = [];
  try { pool = JSON.parse(el.dataset.pool || '[]'); } catch {}
  const idx = parseInt(el.dataset.idx || '0', 10);
  const next = pool[idx + 1] || PLACEHOLDER;
  el.dataset.idx = String(idx + 1);
  el.src = next;
}
