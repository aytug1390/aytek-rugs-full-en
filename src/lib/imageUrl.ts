import { proxify } from './img';

const BASE = (process.env.NEXT_PUBLIC_API_ORIGIN || "http://127.0.0.1:5001").replace(/\/+$/, "");

/**
 * getSafeImgUrl
 * - Proxify absolute http(s) URLs so the browser loads them same-origin.
 * - Leave public `/images/...` and other local static paths untouched (return as-is).
 * - Map `/uploads` (backend-hosted media) to the backend origin.
 * This is conservative and intended for UI callsites that should not accidentally
 * rewrite public `/images` assets to the backend.
 */
export function getSafeImgUrl(u?: string): string {
  if (!u) return "/placeholder.jpg";
  const s = String(u).trim();
  if (!s) return "/placeholder.jpg";
  if (/^https?:\/\//i.test(s)) return proxify(s);
  // Keep public static images served from Next's `public/` folder as-is.
  if (s.startsWith("/images/") || s === "/placeholder.jpg") return s;
  // Backend-hosted uploads should be requested from the API origin.
  if (s.startsWith("/uploads")) return `${BASE}${s}`;
  // Safe default for other absolute paths: leave as-is so we don't accidentally
  // redirect Next public assets to the backend.
  if (s.startsWith("/")) return s;
  // Relative uploads (without leading slash) -> backend origin
  if (s.startsWith("uploads")) return `${BASE}/${s}`;
  // Otherwise return the original string (could be an identifier that backend expects).
  return s;
}

export function getImgUrl(u?: string): string {
  if (!u) return "/placeholder.jpg";
  const s = String(u).trim();
  if (!s) return "/placeholder.jpg";
  // If it's an absolute http(s) URL, return a same-origin proxied URL so
  // client code won't load cross-origin images (prevents CORB/CORS issues).
  if (/^https?:\/\//i.test(s)) return proxify(s);
  if (s.startsWith("/")) return `${BASE}${s}`; // /uploads/a.jpg -> http://127.0.0.1:5001/uploads/a.jpg
  return `${BASE}/${s}`; // uploads/a.jpg -> http://127.0.0.1:5001/uploads/a.jpg
}

export default getImgUrl;
