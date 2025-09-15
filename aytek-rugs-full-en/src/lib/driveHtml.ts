export function rewriteDriveUrlsInHtml(html?: string | null, size = 1200): string {
  if (!html) return '';
  let s = String(html);
  // Replace common Drive thumbnail and file URL patterns in src or href attributes
  // Matches src="...drive.google.com...id=ID..." or src=".../d/ID/..." or src="https://lh3.googleusercontent.com/d/ID=..."
  // We'll replace the attribute value with our proxy `/api/drive?id=ID&sz=SIZE`
  const driveIdFrom = (input: string | null | undefined): string | null => {
    if (!input) return null;
    const t = String(input);
    const q = t.match(/[?&]id=([A-Za-z0-9_-]{8,})/);
    if (q) return q[1];
    const d = t.match(/\/d\/([A-Za-z0-9_-]{8,})/);
    if (d) return d[1];
    const gu = t.match(/googleusercontent\.com\/d\/([A-Za-z0-9_-]{8,})/);
    if (gu) return gu[1];
    const bare = t.match(/^([A-Za-z0-9_-]{8,})$/);
    if (bare) return bare[1];
    return null;
  };

  // Replace src/href/data-src etc.
  s = s.replace(/(src|href|data-src|data-href)=("|')([^"'>]+)("|')/gi, (m, attr, q1, val) => {
    try {
      const id = driveIdFrom(val);
      if (id) {
        return `${attr}=${q1}/api/drive?id=${encodeURIComponent(id)}&sz=${encodeURIComponent(String(size))}${q1}`;
      }
      return `${attr}=${q1}${val}${q1}`;
    } catch (e) {
      return m;
    }
  });

  // Replace srcset and data-srcset entries (comma separated list of url [space] descriptor)
  s = s.replace(/(srcset|data-srcset)=("|')([^"']+)("|')/gi, (m, attr, q1, val) => {
    try {
      const parts = val.split(',').map(p => p.trim());
      const rewritten = parts.map(p => {
        const [url, desc] = p.split(/\s+/);
        const id = driveIdFrom(url);
        if (id) return `/api/drive?id=${encodeURIComponent(id)}&sz=${encodeURIComponent(String(size))}` + (desc ? ' ' + desc : '');
        return p;
      }).join(', ');
      return `${attr}=${q1}${rewritten}${q1}`;
    } catch (e) {
      return m;
    }
  });

  // Replace inline styles background-image: url(...)
  s = s.replace(/style=("|')([^"']*)("|')/gi, (m, q1, val) => {
    try {
      const newVal = val.replace(/url\(([^)]+)\)/gi, (m2, inner) => {
        const cleaned = inner.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        const id = driveIdFrom(cleaned);
        if (id) return `url('/api/drive?id=${encodeURIComponent(id)}&sz=${encodeURIComponent(String(size))}')`;
        return `url(${inner})`;
      });
      return `style=${q1}${newVal}${q1}`;
    } catch (e) {
      return m;
    }
  });

  return s;
}

export default rewriteDriveUrlsInHtml;
