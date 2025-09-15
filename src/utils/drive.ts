export const driveProxy = (id: string, sz = 1200) =>
  `/api/drive?id=${encodeURIComponent(id)}&sz=${sz}`;

const EXTRACTORS: RegExp[] = [
  /thumbnail\?id=([A-Za-z0-9_-]+)/i,
  /uc\?[^#]*?[?&]id=([A-Za-z0-9_-]+)/i,
  /\/d\/([A-Za-z0-9_-]+)/i,
];

export function extractDriveId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  if (!/https?:\/\//i.test(urlOrId)) return urlOrId; // already an id
  for (const rx of EXTRACTORS) {
    const m = urlOrId.match(rx);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function getDriveImageSrc(urlOrId?: string | null, sz = 1200): string | null {
  const id = extractDriveId(urlOrId || "");
  return id ? driveProxy(id, sz) : null;
}

export function makeSrcSet(urlOrId?: string | null, steps = [400, 800, 1200, 1600]) {
  const id = extractDriveId(urlOrId || "");
  if (!id) return undefined;
  return steps.map((w) => `${driveProxy(id, w)} ${w}w`).join(", ");
}
