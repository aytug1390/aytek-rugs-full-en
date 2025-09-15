"use client";
import React, { useEffect, useState } from "react";

type Item = {
  product_id: string;
  title?: string;
  image_url?: string;
  size_text?: string;
  origin?: string;
};
type Products = { total: number; items: Item[]; page?: number; limit?: number };

export default function ProductsGrid({ initial, category, filters }: { initial?: Products; category?: string; filters?: any }) {
  const [data, setData] = useState<Products>(initial ?? { total: 0, items: [], page: 1, limit: 24 });

  // If initial was provided by the server, don't fetch on mount.
  useEffect(() => {
    if (initial) return;
    // initial is not present: client-side fetch logic would go here when needed.
  }, [initial]);

  if (!data?.items?.length) {
    return <div className="p-6">No products (total: {data?.total ?? 0})</div>;
  }

  const buildImageSrc = (p: Item) => {
    // Prefer `image_url` first (explicit): simple proxy path or placeholder
    if (p.image_url) return `/api/drive?src=${encodeURIComponent(p.image_url)}`;
    // tolerate different shapes and objects.
    const candidate = (p as any).image ?? (p as any).images?.[0] ?? null;
    if (!candidate) return '/placeholder.png';
    // If it's an object, try to stringify common fields
    if (typeof candidate === 'object') {
      if (candidate.url) return `/api/drive?src=${encodeURIComponent(String(candidate.url))}`;
      if (candidate.src) return `/api/drive?src=${encodeURIComponent(String(candidate.src))}`;
      return '/placeholder.png';
    }
    const s = String(candidate).trim();
    // If it's a bare Drive ID, use ?id
    if (/^[A-Za-z0-9_-]{8,}$/.test(s)) return `/api/drive?id=${encodeURIComponent(s)}`;
    return `/api/drive?src=${encodeURIComponent(s)}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {data.items.map((p) => (
        <article key={p.product_id} className="border rounded-lg overflow-hidden">
          <img
            src={buildImageSrc(p)}
            alt={p.title ?? p.product_id}
            className="w-full h-48 object-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
          />
          <div className="p-3">
            <div className="font-medium truncate">{p.title ?? p.product_id}</div>
            {p.size_text && <div className="text-xs text-gray-500">{p.size_text}</div>}
            {p.origin && <div className="text-xs text-gray-500">{p.origin}</div>}
          </div>
        </article>
      ))}
    </div>
  );
}

