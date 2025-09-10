export function extractDriveId(input?: string): string | null {
  if (!input) return null;
  const m1 = input.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = input.match(/\/d\/([A-Za-z0-9_-]+)(?:[/?#]|$)/);
  if (m2) return m2[1];
  return null;
}

export function resolveDriveUrlWithFallback(rawUrl?: string, size = 1600) {
  const id = extractDriveId(rawUrl);
  if (!id) return { primary: null, fallback: null };
  // Prefer the uc view URL (serves an image) and fall back to thumbnail if needed.
  // Serve via same-origin proxy to avoid CORB and mixed-content issues in browser
  const proxy = `/api/drive?id=${encodeURIComponent(id)}&sz=${encodeURIComponent(String(size))}`;
  return {
    primary: proxy,
    fallback: `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`,
  };
}

export function resolveDriveUrlAlwaysUC(rawUrl?: string) {
  const id = extractDriveId(rawUrl);
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : null;
}

// Return a usable image src: prefer thumbnail, then uc fallback, else placeholder
export function getDriveImageSrc(rawUrl?: string, size = 1600, placeholder = '/placeholder.jpg') {
  if (!rawUrl) return placeholder;
  // if rawUrl looks like a numeric product id (e.g. '16189' or '16189.0'), treat as missing
  if (/^[0-9]+(?:\.0)?$/.test(rawUrl.trim())) return placeholder;
  const { primary, fallback } = resolveDriveUrlWithFallback(rawUrl, size);
  return primary ?? fallback ?? placeholder;
}

