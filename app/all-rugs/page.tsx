import { headers } from "next/headers";
import ProductsGridClient from "./ProductsGrid.client";
import ProductsGridServer from "./ProductsGrid.server";
import ClientGridWrapper from "./ClientGridWrapper.client";

type Item = {
  product_id: string;
  title?: string;
  image_url?: string;
  description_html?: string;
  price?: number;
  images?: any[];
  origin?: string | null;
  size_text?: string | null;
};

type ProductsResponse = {
  total: number;
  page: number;
  limit: number;
  items: Item[];
  [k: string]: any;
};

async function getBaseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export const revalidate = 60;

export default async function Page({ searchParams }: { searchParams?: { page?: string; limit?: string; q?: string } }) {
  // `searchParams` can be a Promise-like in some Next runtimes. Await it
  // before accessing its properties to follow Next's dynamic API rules.
  const sp = (await Promise.resolve(searchParams)) || {};
  const base = await getBaseUrl();
  const page = Number(sp.page ?? 1) || 1;
  const limit = Number(sp.limit ?? 24) || 24;
  const q = (sp.q || "").trim();

  const url = new URL(`/api/admin-api/products`, base);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (q) url.searchParams.set("q", q);

  const isDev = process.env.NODE_ENV !== "production";

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: isDev ? "no-store" : "default",
    next: isDev ? { revalidate: 0 } : undefined,
  });

  if (!res.ok) {
    throw new Error(`Products fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as ProductsResponse;
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">All Rugs</h1>
      {/* Server-rendered grid for SEO and initial markup */}
      <div id="__all_rugs_server_grid__">
        <ProductsGridServer items={items} total={typeof data.total === 'number' ? data.total : items.length} page={page} limit={limit} />
      </div>

      {/* Hydration: client grid will take over for interactive features */}
      <div id="__all_rugs_client_grid__" className="mt-6">
        {/* Client-side interactive grid (wrapped in ListProvider) */}
        <ClientGridWrapper initialItems={items} total={typeof data.total === 'number' ? data.total : items.length} page={page} limit={limit} q={q ?? ""} />
      </div>
    </div>
  );
}
// Keep the server-side `revalidate` export above (set to 60 by default).



