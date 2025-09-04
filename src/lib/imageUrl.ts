const BASE = (process.env.NEXT_PUBLIC_API_ORIGIN || "").replace(/\/+$/, "");

export function getImgUrl(u?: string): string {
  if (!u) return "/placeholder.jpg";
  const s = String(u).trim();
  if (!s) return "/placeholder.jpg";
  if (/^https?:\/\//i.test(s)) return s;            // already absolute
  if (s.startsWith("/")) return `${BASE}${s}`;       // /uploads/a.jpg -> http://127.0.0.1:5000/uploads/a.jpg
  return `${BASE}/${s}`;                              // uploads/a.jpg -> http://127.0.0.1:5000/uploads/a.jpg
}

export default getImgUrl;
