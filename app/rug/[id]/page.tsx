export const dynamic = 'force-dynamic';

import ZoomImage from './ZoomImage.client';
import Gallery from './Gallery.client';
import { proxify } from '@/lib/img';
import { headers } from 'next/headers';

async function getBaseUrl() {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host')!;
  return `${proto}://${host}`;
}

type Item = {
  _id: string; product_id: string; title?: string;
  image_url?: string; images?: string[]; description_html?: string;
  collection?: string; price?: number; currency?: string; origin?: string | null; size_text?: string | null;
};

async function getItem(id: string) {
  // derive absolute base URL from request headers so new URL() calls work in Node
  const base = await getBaseUrl();
  // 1) Try direct fetch by id
  let res = await fetch(`${base}/api/admin-api/products/${encodeURIComponent(id)}`, { cache: 'no-store', headers: { 'x-ssr': 'rug' } });
  if (res.ok) {
    const payload = await res.json();
    // upstream proxy may return { ok: true, id, product } or { item } or raw product
    const raw = payload?.item ?? payload?.product ?? payload?.data ?? payload;
    return { item: raw as Item };
  }

  // 2) Fallback: try searching by product_id filter
  const res2 = await fetch(
    `${base}/api/admin-api/products?limit=1&page=1&product_id=${encodeURIComponent(id)}`,
    { cache: 'no-store', headers: { 'x-ssr': 'rug' } }
  );
  if (!res2.ok) throw new Error(`Upstream ${res2.status}`);
  const data = await res2.json() as { items: Item[] };
  if (!data.items?.length) throw new Error('Not found');
  return { item: data.items[0] };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { item } = await getItem(id);
  if (!item) return (
    // If item couldn't be found, show 404-like message server-side
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold">Item not found</h1>
      <p className="text-sm text-gray-600">The requested product could not be located.</p>
    </main>
  );

  // primary cover: support older shape `image_url` or newer product.images[{url}]
  const primaryRawUrl = item.image_url ?? (Array.isArray(item.images) && item.images[0] ? (typeof item.images[0] === 'string' ? item.images[0] : (item.images[0] as any).url) : null);
  const cover = primaryRawUrl ? proxify(primaryRawUrl) : '/placeholder.jpg';
  const isSilver = item.collection === 'silver';
  const priceText = isSilver && item.price != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency || 'USD' }).format(item.price) : null;
  const imageUrls = Array.isArray(item.images)
    ? item.images.map((it: any) => (typeof it === 'string' ? it : it?.url)).filter(Boolean).map((u: string) => proxify(u))
    : [];

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h1 className="text-2xl font-semibold mb-3">{item.title || item.product_id}</h1>
          <div className="relative inline-block">
            <ZoomImage src={cover} alt={item.title || item.product_id} zoom={2.2} />
            {/* Dev-friendly badge when primary image missing */}
            {(!item.image_url && !(Array.isArray(item.images) && item.images.some((i: any) => i.url))) && (
              <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                Görsel eksik — Admin&apos;de güncelleyin
              </div>
            )}
          </div>

          {/* içerik fotoğrafları */}
          {imageUrls.length > 0 ? (
            <Gallery urls={imageUrls} />
          ) : (
            <div className="text-sm text-gray-500 mt-3">
              <img src="/placeholder.jpg" alt="placeholder" className="w-full h-auto mb-2" />
              <div>Ek fotoğraflar yok. Bilgi yok.</div>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="text-sm text-gray-700 space-y-1">
            <div><span className="font-medium">SKU:</span> {item.product_id}</div>
            <div><span className="font-medium">Size:</span> {(item.size_text || '').trim() || '—'}</div>
            <div><span className="font-medium">Origin:</span> {item.origin || '—'}</div>
          </div>

          {priceText ? (
            <div className="mt-2 text-emerald-600 font-semibold">{priceText}</div>
          ) : (
            <div className="mt-2 text-gray-500 text-sm">Price on request</div>
          )}

          {/* açıklama */}
          {item.description_html ? (
            <article
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: item.description_html }}
            />
          ) : (
            <p className="text-sm text-gray-500">Açıklama yakında eklenecek.</p>
          )}

          <a className="inline-block rounded-lg border px-4 py-2 hover:bg-gray-50" href={`/rug/${item.product_id ?? item._id}/deep-zoom`}>
            Open detailed zoom
          </a>
        </aside>
      </div>
    </main>
  );
}

