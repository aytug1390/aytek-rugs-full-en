import { jsonUtf8 } from '@/lib/responses';
import { cookies } from "next/headers";

export async function GET() {
  const c = cookies().get("admin_sess");
  if (c?.value === "ok") return jsonUtf8({ ok: true });
  return jsonUtf8({ ok: false }, { status: 401 });
}

