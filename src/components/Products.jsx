"use client";

import { useEffect, useMemo, useState } from "react";

export default function Products({ initialCategory }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = "/admin-api/products?limit=60";
    if (initialCategory) url += `&category=${encodeURIComponent(initialCategory)}`;

    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        setItems(data.items || data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [initialCategory]);

  const filtered = useMemo(() => {
    if (!initialCategory) return items;
    return items.filter(
      (p) =>
        p.category === initialCategory ||
        p.categories?.includes?.(initialCategory)
    );
  }, [items, initialCategory]);

  if (loading) return <div className="py-10 text-center">Loading…</div>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((p) => (
        <article key={p._id || p.product_id} className="group border rounded-2xl overflow-hidden">
          <div className="h-56 bg-gray-100">
            <img
              src={p.images?.[0]?.url}
              alt={p.images?.[0]?.alt || p.name || p.product_id}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold">{p.name || p.product_id}</h3>
            {p.price && <p className="text-gray-700">${p.price}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}
