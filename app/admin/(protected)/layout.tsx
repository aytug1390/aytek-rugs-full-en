export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const token = (await cookies()).get("admin_sess")?.value;
  if (token !== "ok") {
    const h = await headers();
    const path =
      h.get("next-url") ||
      h.get("x-invoke-path") ||
      h.get("x-matched-path") ||
      "/admin";
    // slash'ları koru:
    redirect(`/admin/login?from=${encodeURI(path)}`);
  }
  return <>{children}</>;
}
