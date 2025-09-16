"use client";

import React, { useState } from "react";
import ProductCard from "@/components/ProductCard";

type Item = {
  product_id: string;
  title?: string;
  image_url?: string;
  description_html?: string;
  price?: number;
  images?: any[];
};

export default function ProductsGridClient({
  initialItems = [],
  total = 0,
  page = 1,
  limit = 24,
  q = "",
}: {
  initialItems?: Item[];
  total?: number;
  page?: number;
  limit?: number;
  q?: string;
}) {
  const [items] = useState<Item[]>(initialItems || []);

  const hasNext = (page * limit) < (total || items.length);
  const hasPrev = (page || 1) > 1;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <ProductCard key={it.product_id} p={it} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <a
          className={`px-3 py-2 rounded border ${hasPrev ? "opacity-100" : "opacity-40 pointer-events-none"}`}
          href={`/all-rugs?page=${page - 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
        >
          ← Prev
        </a>
        <span className="text-sm">Page {page} • Showing {items.length} / {total}</span>
        <a
          className={`px-3 py-2 rounded border ${hasNext ? "opacity-100" : "opacity-40 pointer-events-none"}`}
          href={`/all-rugs?page=${page + 1}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
        >
          Next →
        </a>
      </div>
    </div>
  );
}
// End of module - single client component kept above.
