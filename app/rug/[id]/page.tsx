import React from "react";
import DriveImg from '../DriveImg.client';
import Gallery from '../Gallery.client';
import { resolveDriveUrlWithFallback, getDriveImageSrc } from '../../../src/lib/drive';

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, any>> };

async function fetchProduct(id: string) {
  const proxy = process.env.NEXT_PUBLIC_PROXY_ORIGIN || "http://127.0.0.1:3000";
  // If the id looks like a Mongo ObjectId (24 hex chars), prefer the single-item proxy route
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (isObjectId) {
    const r = await fetch(`${proxy}/api/admin-api/products/${encodeURIComponent(id)}`, { cache: "no-store", headers: { Accept: "application/json" } });
    if (r.ok) {
      try {
        const body = await r.json();
        // our [id] proxy returns { ok: true, id, product }
        return body?.product ?? null;
      } catch (e) {
        // fall through to fallback below
      }
    }
    // If single-item proxy failed (404 or other), fall back to list query by product_id
    // This helps when upstream doesn't implement /products/:id but list endpoint contains the item
    const fallbackUrl = `${proxy}/api/admin-api/products?product_id=${encodeURIComponent(id)}&limit=1`;
    const fallbackRes = await fetch(fallbackUrl, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (fallbackRes.ok) {
      try {
        const body = await fallbackRes.json();
        const item = Array.isArray(body.items) && body.items[0] ? body.items[0] : null;
        if (item) return item;
      } catch (e) {
        // continue to legacy mapping fallback
      }
    }

    // Legacy-id mapping fallback: consult the persistent legacy_ids collection in MongoDB
    try {
      const { MongoClient } = await import('mongodb');
      const MONGO_URI = process.env.MONGO_URI;
      const MONGO_DB = process.env.MONGO_DB || 'aytekdb';
      if (MONGO_URI) {
        const client = new MongoClient(MONGO_URI);
        try {
          await client.connect();
          const db = client.db(MONGO_DB);
          const coll = db.collection('legacy_ids');
          const doc = await coll.findOne({ legacy_id: String(id) });
          if (doc && doc.product_id) {
            const pid = String(doc.product_id);
            const mappedUrl = `${proxy}/api/admin-api/products?product_id=${encodeURIComponent(pid)}&limit=1`;
            const mappedRes = await fetch(mappedUrl, { cache: 'no-store', headers: { Accept: 'application/json' } });
            if (mappedRes.ok) {
              try {
                const payload = await mappedRes.json();
                const item = Array.isArray(payload.items) && payload.items[0] ? payload.items[0] : null;
                if (item) return item;
              } catch (e) {
                // ignore parse errors
              }
            }
          }
        } finally {
          try { await client.close(); } catch (e){}
        }
      }
    } catch (e) {
      // ignore db errors
    }

    // If DB lookup didn't succeed (no MONGO_URI or no doc), fall back to local tmp files
    try {
      // dynamic import of fs so Next can tree-shake client bundles
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = await import('fs');
      const path = await import('path');
      const cwd = process.cwd();
      const candidates = [
        path.resolve(cwd, 'tmp_products_colors_backup.json'),
        path.resolve(cwd, 'tmp_products_backup.json'),
        path.resolve(cwd, 'tmp_image_report.json')
      ];
      for (const f of candidates) {
        try {
          if (!fs.existsSync(f)) continue;
          const raw = fs.readFileSync(f, 'utf8');
          const data = JSON.parse(raw);
          const list = data.products ?? data.items ?? data;
          if (!Array.isArray(list)) continue;
          const found = list.find((p: any) => String(p._id) === String(id));
          if (found && (found.product_id || found.productId || found.id)) {
            const pid = String(found.product_id ?? found.productId ?? found.id);
            const mappedUrl = `${proxy}/api/admin-api/products?product_id=${encodeURIComponent(pid)}&limit=1`;
            const mappedRes = await fetch(mappedUrl, { cache: 'no-store', headers: { Accept: 'application/json' } });
            if (!mappedRes.ok) continue;
            try {
              const payload = await mappedRes.json();
              const item = Array.isArray(payload.items) && payload.items[0] ? payload.items[0] : null;
              if (item) return item;
            } catch (e) {
              // ignore parse errors and continue
            }
          }
        } catch (e) {
          // ignore per-file errors
        }
      }
    } catch (e) {
      // ignore fs errors
    }
    return null;
  }

  // fallback: query by product_id via list endpoint
  const url = `${proxy}/api/admin-api/products?product_id=${encodeURIComponent(id)}&limit=1`;
  const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const body = await res.json();
  const item = Array.isArray(body.items) && body.items[0] ? body.items[0] : null;
  return item;
}

export default async function RugDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="mt-4 text-gray-600">No product found for id {id}</p>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []);
  const primary = images.find((i: any) => i.isPrimary) ?? images[0];
  const gallery = images.length > 0 ? images : (product.main_image ? [{ url: product.main_image, alt: product.title }] : []);

  // server component: uses client DriveImg for interactive <img> error handling

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {primary || gallery.length ? (
            <div className="space-y-4">
              {/* client-side gallery handles main image + clickable thumbnails with Drive fallback */}
              {/* @ts-ignore server -> client import */}
              <Gallery images={gallery} productTitle={product.title || product.product_id} />
            </div>
          ) : (
            <div className="h-96 bg-gray-100 rounded" />
          )}
        </div>

        <aside className="p-4 bg-white rounded shadow">
          <h1 className="text-2xl font-semibold mb-2">{product.title || product.product_id}</h1>
          <div className="text-lg text-gray-700 font-medium mb-4">
            {
              (() => {
                const priceRaw = product.sale_price ?? product.price;
                const priceNum = Number(priceRaw);
                return Number.isFinite(priceNum) && priceNum > 0 ? `$${priceNum.toFixed(2)}` : '—';
              })()
            }
          </div>
          <div className="prose max-w-none text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: product.description_html || product.description || product.long_description || '' }} />

          {/* Show assigned colors (hex swatches + buckets) inside the product details so users see them before filtering */}
          {((product.color_hex && product.color_hex.length) || (product.color_code && product.color_code.length)) ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Colors</h3>
              <div className="flex flex-wrap items-center gap-3">
                {(product.color_hex || []).map((h: any, idx: number) => (
                  <div key={String(h) + '-' + idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: h || 'transparent' }} aria-hidden="true" />
                    <span className="text-xs text-gray-600">{h}</span>
                  </div>
                ))}
                {(!product.color_hex || product.color_hex.length === 0) && product.color_code && product.color_code.length === 0 ? null : null}
              </div>
              {product.color_code && product.color_code.length ? (
                <div className="mt-2 text-xs text-gray-600">Buckets: {product.color_code.join(', ')}</div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 text-sm text-gray-600">Availability: {product.availability || 'in stock'}</div>
        </aside>
      </div>
    </div>
  );
}
