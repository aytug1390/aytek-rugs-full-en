// Small helper utilities to extract Google Drive file IDs and build robust image URLs
export function extractDriveId(input) {
  if (!input) return null;
  const m1 = input.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = input.match(/\/d\/([A-Za-z0-9_-]+)(?:[\/?#]|$)/);
  if (m2) return m2[1];
  return null;
}

export function resolveDriveUrlWithFallback(rawUrl, size = 1600) {
  const id = extractDriveId(rawUrl);
  if (!id) return { primary: null, fallback: null };
  return {
    primary: `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`,
    fallback: `https://drive.google.com/uc?export=view&id=${id}`,
  };
}

export function resolveDriveUrlAlwaysUC(rawUrl) {
  const id = extractDriveId(rawUrl);
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : null;
}
