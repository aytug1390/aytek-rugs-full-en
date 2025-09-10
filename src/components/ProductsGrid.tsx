"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from 'next/navigation';
import ProductCard from "./ProductCard";
import type { Filters } from "./FiltersPanel";
import { safeJson } from "@/lib/safeJson";

function buildQuery(filters?: Filters, category?: string, page = 1, limit = 24, sort?: string) {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  q.set("page", String(page));
  // default to only products that have at least one image
  q.set("has_image", "1");
  if (category) q.set("category", category);
  if (sort === "price-asc") q.set("sort", "price:asc");
  if (sort === "price-desc") q.set("sort", "price:desc");
  if (!filters) return q;

  if (filters.stock?.length) q.set("stock", filters.stock.join(","));
  if (filters.collection?.length) q.set("collection", filters.collection.join(","));
  if (filters.design?.length) q.set("design", filters.design.join(","));
  if (filters.color?.length) q.set("color", filters.color.join(","));
  if (filters.size?.length) q.set("size", filters.size.join(","));
  return q;
}

export default function ProductsGrid({ category, filters }: { category?: string; filters?: Filters }) {
  const searchParams = useSearchParams();
  console.log('[ProductsGrid] mount searchParams=', (searchParams || new URLSearchParams()).toString());
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<string>("featured");
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const limit = 24;

  const serializedFilters = useMemo(() => JSON.stringify(filters || null), [filters]);
  useEffect(() => { setPage(1); }, [category, serializedFilters, sort]);

  useEffect(() => {
    // If a filters prop is provided (explicit), use it; otherwise read from URL search params so Apply shows filtered results.
    let q;
    if (filters) {
      q = buildQuery(filters, category, page, limit, sort);
    } else {
      const sp = new URLSearchParams((searchParams || new URLSearchParams()).toString());
      // enforce defaults/overrides
      sp.set('limit', String(limit));
      sp.set('page', String(page));
      if (!sp.has('has_image')) sp.set('has_image', '1');
      // map local sort state to query when applicable
      if (sort === 'price-asc') sp.set('sort', 'price:asc');
      else if (sort === 'price-desc') sp.set('sort', 'price:desc');
      else sp.delete('sort');
      if (category) sp.set('category', category);
      q = sp;
    }
    const url = `/admin-api/products?${q.toString()}`;
    let alive = true;
  (async () => {
      setLoading(true);
      try {
        const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
        const data = await safeJson(res, { items: [], total: 0 });
  console.log('[ProductsGrid] fetched', url, 'total=', data?.total, 'items=', Array.isArray(data?.items) ? data.items.length : 0);
        if (!alive) return;
        const arr = Array.isArray(data.items) ? data.items : [];
        setItems(arr);
        setTotal(typeof data.total === "number" ? data.total : arr.length);
      } catch {
        if (!alive) return;
        setItems([]); setTotal(0);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [category, filters, page, sort, searchParams]);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex-1">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">{total} rugs</div>
        <div className="flex items-center gap-2">
          <select className="border rounded-lg px-2 py-1 text-sm" value={sort} onChange={(e)=>setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          <div className="flex items-center gap-1">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}
              className="px-2 py-1 border rounded-md text-sm disabled:opacity-50">Prev</button>
            <span className="text-sm">{page} / {pageCount}</span>
            <button disabled={page>=pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}
              className="px-2 py-1 border rounded-md text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_,i)=>(
            <div key={i} className="rounded-2xl border overflow-hidden bg-white">
              <div className="animate-pulse aspect-[4/3] bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-gray-600">No products found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {items.map(p => <ProductCard key={p._id ?? p.product_id ?? p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

