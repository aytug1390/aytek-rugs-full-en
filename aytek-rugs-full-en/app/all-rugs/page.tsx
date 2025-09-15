import ProductsGrid from "@/components/ProductsGrid";

export default async function AllRugsPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://127.0.0.1:3000";
  const res = await fetch(
    `${base}/api/admin-api/products?limit=24&has_image=1&status=active&visibility=public`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    return <div className="p-6 text-red-600">Failed: {res.status}</div>;
  }
  const data = await res.json();
  const first = Array.isArray(data?.items) ? data.items.slice(0, 8) : [];

  return (
    <div>
      {/* DEBUG BANNER */}
      <div style={{ position: 'sticky', top: 0, zIndex: 9999, background: '#fff', padding: 8, border: '2px solid red' }}>
        ALL-RUGS-OK — total: {data?.total ?? 0} (SSR fallback below)
      </div>

      {/* SSR FALLBACK (visible even if client hydration fails) */}
      <ul id="ssr-fallback" style={{ padding: 12, border: '1px dashed #aaa', margin: 12 }}>
        {first.length === 0 ? (
          <li>No SSR items found</li>
        ) : (
          first.map((p: any) => (
            <li key={p.product_id}>{p.title ?? p.product_id} — {p.size_text ?? '-'}</li>
          ))
        )}
      </ul>

      {/* Normal Grid (client component) */}
      <ProductsGrid initial={data} />

      <script
        // Hydration başarılı olunca fallback'i gizle
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function(){
              var el = document.getElementById('ssr-fallback');
              if (el) el.style.display = 'none';
            });
          `,
        }}
      />
    </div>
  );
}



