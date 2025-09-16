// Utility helpers to normalize Google Drive URLs/IDs and produce a local proxy src
export function driveIdFrom(input: unknown): string | null {
  if (!input) return null;
  const s = String(input).trim();
  // If it's already an ID (alphanumeric, dashes, underscores, length 10+)
  if (/^[A-Za-z0-9_-]{10,}$/.test(s)) return s;

  // Common Drive share/viewer patterns
  // 1) https://drive.google.com/uc?export=view&id=FILEID
  const ucMatch = s.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  // 2) https://drive.google.com/file/d/FILEID/view
  const fileDMatch = s.match(/\/d\/([A-Za-z0-9_-]+)/);
  if (fileDMatch) return fileDMatch[1];

  // 3) urls like https://docs.google.com/uc?export=download&id=FILEID
  const downloadMatch = s.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (downloadMatch) return downloadMatch[1];

  return null;
}

export function driveSrc(input: unknown): string | null {
  const id = driveIdFrom(input);
  if (!id) return null;
  return `/api/drive?id=${encodeURIComponent(id)}`;
}

export default driveSrc;

/**
 * Build a same-origin proxy image src for a Drive URL or already-proxied path.
 * - If `input` already looks like `/api/drive` it will append/replace `sz`.
 * - If `input` is a Drive share URL or id it will return `/api/drive?id=...&sz=...`.
 * - Otherwise returns the original string (useful for other remote images).
 */
export function getDriveImageSrc(input: unknown, size = 1600): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // If it's already a same-origin proxy path, update the sz param.
  if (s.includes('/api/drive')) {
    try {
      const u = new URL(s, 'http://example.com');
      u.searchParams.set('sz', String(size));
      // keep relative path so callers remain same-origin
      return u.pathname + u.search;
    } catch (e) {
      // Fallback to simple string manipulation
      if (s.includes('?')) {
        if (s.match(/[?&]sz=[^&]*/)) {
          return s.replace(/([?&])sz=[^&]*/, `$1sz=${size}`);
        }
        return s + `&sz=${size}`;
      }
      return s + `?sz=${size}`;
    }
  }

  // If input contains a Drive id, return a proxy URL with size.
  const id = driveIdFrom(s);
  if (id) return `/api/drive?id=${encodeURIComponent(id)}&sz=${size}`;

  // Otherwise return the original string (external image).
  return s;
}

// -- prefer-local manifest helper ----------------------------------------
let _manifestCache: Record<string, string> | null = null;
let _manifestLoading = false;

function loadManifestOnce() {
  if (_manifestCache || _manifestLoading) return;
  _manifestLoading = true;
  try {
    // Try common build-time locations first (project-level public folders)
    try {
      // prefer the project-specific public (aytek-rugs-full-en)
      const mf = require('../../aytek-rugs-full-en/public/images/products/manifest.json');
      _manifestCache = {};
      for (const item of mf) {
        const id = String(item.url || '').match(/[?&]id=([A-Za-z0-9_-]+)/)?.[1];
        if (id) _manifestCache[id] = item.local;
      }
      _manifestLoading = false;
      return;
    } catch (e) {
      // ignore and try top-level public
    }
    try {
      const mf2 = require('../../public/images/products/manifest.json');
      _manifestCache = {};
      for (const item of mf2) {
        const id = String(item.url || '').match(/[?&]id=([A-Za-z0-9_-]+)/)?.[1];
        if (id) _manifestCache[id] = item.local;
      }
      _manifestLoading = false;
      return;
    } catch (err) {
      // fallback to client fetch
      (async () => {
        try {
          const r = await fetch('/images/products/manifest.json');
          if (r.ok) {
            const mf3 = await r.json();
            _manifestCache = {};
            for (const item of mf3) {
              const id = String(item.url || '').match(/[?&]id=([A-Za-z0-9_-]+)/)?.[1];
              if (id) _manifestCache[id] = item.local;
            }
          }
        } catch (_) {
          _manifestCache = {};
        } finally {
          _manifestLoading = false;
        }
      })();
    }
  } catch (err) {
    _manifestCache = {};
    _manifestLoading = false;
  }
}

export function preferLocalDriveSrc(input: unknown, size = 1600, placeholder = '/placeholder.jpg') {
  if (!input) return placeholder;
  const id = driveIdFrom(input);
  if (!id) return getDriveImageSrc(input, size) || String(input);
  loadManifestOnce();
  if (_manifestCache && _manifestCache[id]) return _manifestCache[id];
  return getDriveImageSrc(input, size) || String(input);
}
