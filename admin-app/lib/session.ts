import crypto from "crypto";

const COOKIE = "aytek_sess";
const HMAC_SECRET = process.env.ADMIN_HMAC_SECRET || process.env.ADMIN_HMAC_SECRET;

export function sign(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", HMAC_SECRET || '').update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function verify(token?: string): null | any {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const good = crypto.createHmac("sha256", HMAC_SECRET || '').update(body).digest("base64url");
  if (sig !== good) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()); } catch { return null; }
}
export function getSessionCookie() { return COOKIE; }
