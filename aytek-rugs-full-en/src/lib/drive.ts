import { extractDriveId, buildDriveCandidates, PLACEHOLDER } from './driveImage';
import getImgUrl from './imageUrl';

/**
 * Return a preferred local/proxy URL for a drive-like source, otherwise fallback to placeholder.
 */
export function preferLocalDriveSrc(src?: string | null, size = 1200): string {
  if (!src) return PLACEHOLDER;
  const id = extractDriveId(src);
  if (id) return `/api/drive?id=${encodeURIComponent(id)}&sz=${encodeURIComponent(String(size))}`;
  // If it's already an absolute or app path, return via getImgUrl
  return getImgUrl(src);
}

/**
 * Provide a drive-friendly image URL (best-effort), similar to old helper.
 */
export function getDriveImageSrc(src?: string | null, size = 1200): string {
  if (!src) return PLACEHOLDER;
  const id = extractDriveId(src);
  if (id) return `/api/drive?id=${encodeURIComponent(id)}&sz=${encodeURIComponent(String(size))}`;
  return getImgUrl(src);
}

/**
 * Resolve a drive URL with fallbacks (returns first usable candidate)
 */
export function resolveDriveUrlWithFallback(src?: string | null): string {
  const candidates = buildDriveCandidates(src || undefined);
  return candidates[0] || PLACEHOLDER;
}

/**
 * Case-insensitive safe resolver — keep name for compatibility.
 */
export const resolveDriveUrlAlwaysUC = (s?: string | null) => resolveDriveUrlWithFallback(s);

export default {
  preferLocalDriveSrc,
  getDriveImageSrc,
  resolveDriveUrlWithFallback,
  resolveDriveUrlAlwaysUC,
};
