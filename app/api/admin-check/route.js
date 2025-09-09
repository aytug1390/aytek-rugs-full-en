import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const c = cookies().get("admin_sess");
  if (c?.value === "ok") return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}
