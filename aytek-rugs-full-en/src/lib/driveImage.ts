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
  let s = String(input).trim();
  // strip surrounding angle-brackets or quotes
  s = s.replace(/^<|>$/g, '').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  // bare id
  const bare = s.match(/^([A-Za-z0-9_-]{8,})$/);
  if (bare) return bare[1];
  // common query patterns
  const qMatch = s.match(/[?&]id=([A-Za-z0-9_-]{8,})/);
  if (qMatch) return qMatch[1];
  const exportMatch = s.match(/export=download&id=([A-Za-z0-9_-]{8,})/);
  if (exportMatch) return exportMatch[1];
  // path-based patterns
  const dMatch = s.match(/\/d\/([A-Za-z0-9_-]{8,})/);
  if (dMatch) return dMatch[1];
  const fileDMatch = s.match(/file\/d\/([A-Za-z0-9_-]{8,})/);
  if (fileDMatch) return fileDMatch[1];
  // googleusercontent style
  const guMatch = s.match(/googleusercontent\.com\/d\/([A-Za-z0-9_-]{8,})/);
  if (guMatch) return guMatch[1];
  // final attempt via URL parsing
  try {
    const u = new URL(s);
    const q = u.searchParams.get('id');
    if (q && /^[A-Za-z0-9_-]{8,}$/.test(q)) return q;
  } catch {}
  return null;
}

export function buildDriveCandidates(src?: string | null): string[] {
  const id = extractDriveId(src);
  const list: string[] = [];
  if (id) {
    // Prefer same-origin proxy so callers can use a single origin for images.
    list.push(`/api/drive?id=${id}&sz=1200`);
    // Keep proxy-only candidates; avoid emitting direct drive.google.com or lh3 URLs.
  }
  if (src) list.push(src);
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
