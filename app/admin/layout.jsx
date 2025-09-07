export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }) {
  // Top-level admin layout: UI shell only. No redirects here.
  return <>{children}</>;
}
