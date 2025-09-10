import ProductCard from '../components/ProductCard2';
import Filters from './Filters.client';
import ProductsGrid from '../../src/components/ProductsGrid';
import Link from 'next/link';
import CategoryFilter from '../components/CategoryFilter';
import { ListProvider } from '../../src/context/ListContext';

export const dynamic = 'force-dynamic'; // cache kapal

async function fetchProducts(searchParams: any = {}) {
  const page  = Number(searchParams.page ?? 1);
  const limit = 50;
  const q     = searchParams.q ?? '';
  const category = searchParams.category ?? '';

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  // forward common filter params (so backend can apply them)
  const forwardKeys = ['min_width', 'max_width', 'min_height', 'max_height', 'origin', 'color', 'size'];
  for (const k of forwardKeys) {
    if (searchParams && typeof searchParams[k] !== 'undefined' && searchParams[k] !== null && String(searchParams[k]).length) {
      params.set(k, String(searchParams[k]));
    }
  }
  // default: only fetch products that have at least one image unless explicitly asked
  if (searchParams.show !== 'all') params.set('has_image', '1');

  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:5000';
  try {
  const url = `${base}/admin-api/products?${params}`;
  try { console.log('[fetchProducts] fetching upstream', url); } catch (e) {}
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  const json = await res.json();
  try { console.log('[fetchProducts] upstream returned total=', json?.total, 'sample=', (json?.items||[]).slice(0,3).map(i=>i.product_id||i._id)); } catch (e) {}
  return json;
  } catch (e) {
    // Backend may be down during local dev — return safe fallback
    return { items: [], total: 0, page: page };
  }
}

async function getCategories(){
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:5000';
  try {
    const r = await fetch(`${base}/admin-api/categories`, { cache: 'no-store' });
    if (!r.ok) return [];
    const { items } = await r.json();
    return items;
  } catch (e) {
    return [];
  }
}

export default async function AllRugsPage({ searchParams }: { searchParams?: any }) {
  const params = await searchParams;
  // debug log of incoming params during SSR (safe for local debugging)
  try { console.log('[all-rugs] searchParams', params); } catch (e) {}
  const data = await fetchProducts(params);
  // fetch a definitive total for the applied filters so UI shows accurate count
  // Use Next proxy so server-side rendering goes through the same path we tested
  // Must be an absolute origin on the server; empty string produces invalid URL.
  const proxyBase = process.env.NEXT_PUBLIC_PROXY_ORIGIN || 'http://127.0.0.1:3000';
  const countParams = new URLSearchParams();
  if (params.q) countParams.set('q', params.q);
  if (params.category) countParams.set('category', params.category);
  // forward numeric and other filters to the count endpoint as well
  const countForward = ['min_width', 'max_width', 'min_height', 'max_height', 'origin', 'color', 'size'];
  for (const k of countForward) {
    if (params && typeof params[k] !== 'undefined' && params[k] !== null && String(params[k]).length) {
      countParams.set(k, String(params[k]));
    }
  }
  if (params && params.show !== 'all') countParams.set('has_image', '1');
  // default to public active listing
  countParams.set('status', 'active');
  countParams.set('visibility', 'public');
  countParams.set('count_only', '1');
  const countRes = await fetch(`${proxyBase}/api/admin-api/products?${countParams}`, { cache: 'no-store' });
  const countJson = countRes.ok ? await countRes.json() : { total: data.total };
  const totalCount = countJson.total ?? data.total;
  const totalPages = Math.ceil(totalCount / 50);
  const currentPage = Number(params.page ?? 1);
  const categories = await getCategories(); // filtre barı için

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-2">All Rugs <span id="total-count" data-total={totalCount} className="text-gray-600">({totalCount})</span></h1>
      <p className="text-sm text-gray-500 mb-6">Page {data.page} / {totalPages}</p>
      <CategoryFilter categories={categories} />
      <div className="mb-4">
        <Link href="/categories" className="text-blue-600 hover:underline">Explore our collections</Link>
      </div>
      <Filters />
      <div className="mb-8">
        <ListProvider>
          <ProductsGrid category={params?.category} />
        </ListProvider>
      </div>
    </main>
  );
}
// single copy kept



