import { NextResponse } from "next/server";

type Params = { id: string };

import fs from 'fs';
import path from 'path';
import { tryFetchWithRetries } from '../../../../../lib/adminApiProxy';
import { jsonUtf8 } from '@/lib/responses';

// Use the same base logic as other proxy handlers: prefer explicit API_BASE, then ADMIN_API_ORIGIN.
// If the configured base already contains the '/admin-api' segment, use it as-is. Otherwise append
// '/admin-api'. This avoids mismatches when ADMIN_API_KEEP_PREFIX or the env values differ.
const API_BASE = process.env.API_BASE || process.env.ADMIN_API_ORIGIN || "http://127.0.0.1:5000";
const UPSTREAM = API_BASE.endsWith('/admin-api') ? API_BASE : `${API_BASE.replace(/\/+$/, '')}/admin-api`;


function normalizeProduct(raw: any) {
  if (!raw || typeof raw !== "object") return null;
  // Accept various aliases for images that may appear in upstream payloads
  let images: any[] = [];
  if (Array.isArray(raw.images)) images = raw.images;
  else if (Array.isArray(raw.photos)) images = raw.photos;
  else if (Array.isArray(raw.media?.images)) images = raw.media.images;
  else if (raw.image_url) images = [{ url: raw.image_url, alt: raw.image_alt ?? raw.image_caption ?? '' }];
  else if (Array.isArray(raw.image_urls)) images = raw.image_urls.map((u: any) => (typeof u === 'string' ? { url: u } : u));
  // normalize collections and tags: lowercase, dedupe
  const rawCollections = Array.isArray(raw.collections) ? raw.collections : raw.collections ? [raw.collections] : [];
  const rawTags = Array.isArray(raw.tags) ? raw.tags : raw.tags ? [raw.tags] : [];
  const normCollections = Array.from(new Set(rawCollections.map((c:any) => String(c).toLowerCase()))).filter(Boolean);
  const normTags = Array.from(new Set(rawTags.map((t:any) => String(t).toLowerCase()))).filter(Boolean);
  // If either tags or collections mention 'traditional', ensure it's present in collections
  if (normTags.includes('traditional') || normCollections.includes('traditional') || String(raw.category ?? '').toLowerCase() === 'traditional') {
    if (!normCollections.includes('traditional')) normCollections.unshift('traditional');
  }

  return {
    _id: String(raw._id ?? raw.id ?? ""),
    product_id: String(raw.product_id ?? raw.id ?? ""),
    title: String(raw.title ?? raw.name ?? ""),
    availability: String(raw.availability ?? raw.status ?? ""),
    price: raw.price ?? null,
    sale_price: raw.sale_price ?? null,
    description_html: String(raw.description_html ?? raw.description ?? ""),
  images: images.map((img: any, i: number) => ({
      url: String(img?.url ?? img?.src ?? img ?? ""),
      alt: String(img?.alt ?? img?.caption ?? img?.alt_text ?? `Image ${i + 1}`),
      isPrimary: Boolean(img?.isPrimary ?? img?.primary ?? i === 0),
    })),
  // color-related fields (upstream may provide any of these)
  color: Array.isArray(raw.color) ? raw.color.map((c: any) => String(c)) : raw.color ? [String(raw.color)] : [],
  color_hex: Array.isArray(raw.color_hex) ? raw.color_hex.map((c: any) => String(c)) : raw.color_hex ? [String(raw.color_hex)] : [],
  color_code: Array.isArray(raw.color_code) ? raw.color_code.map((c: any) => String(c)) : raw.color_code ? [String(raw.color_code)] : [],
  size_text: raw.size_text ?? raw.sizeText ?? raw.size ?? null,
  has_image: Boolean(raw.has_image ?? raw.hasImage ?? (Array.isArray(images) && images.length > 0) ?? false),
  image_url: String(raw.image_url ?? raw.imageUrl ?? raw.image ?? (images[0]?.url) ?? ""),
  collections: normCollections,
  tags: normTags,
  brand: raw.brand ?? null,
  origin_country: raw.origin_country ?? raw.origin ?? null,
  height_cm: raw.height_cm ?? raw.height ?? null,
  width_cm: raw.width_cm ?? raw.width ?? null,
  slug: raw.slug ?? null,
  status: raw.status ?? null,
  visibility: raw.visibility ?? null,
  createdAt: raw.createdAt ?? null,
  updatedAt: raw.updatedAt ?? null,
  };
}

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params; // Next 15: params Promise!
  console.log('[proxy:/api/admin-api/products/:id] request id ->', id);

  const singleUrl = `${UPSTREAM}/products/${encodeURIComponent(id)}`;
  console.log('[proxy] upstream single-url ->', singleUrl);
  const r = await tryFetchWithRetries(singleUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!r.ok) {
    console.warn('[proxy:/api/admin-api/products/:id] upstream status', r.status, 'for id', id);
    // If the upstream single-item endpoint returns 404, try the list endpoint by product_id
        if (r.status === 404) {
      console.log('[proxy] upstream 404, attempting fallback list-by-product_id for', id);
      try {
  // first try product_id lookup
  const listUrl = `${UPSTREAM}/products?product_id=${encodeURIComponent(id)}&limit=1`;
  console.log('[proxy] fallback list-url ->', listUrl);
  const listRes = await tryFetchWithRetries(listUrl, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }, 2, 200);
        console.log('[proxy] fallback list endpoint status', listRes.status, 'for product_id=', id);
        if (listRes.ok) {
          let listPayload: any = null;
          try { listPayload = await listRes.json(); } catch (e) { listPayload = null; }
          // attempt to extract first item
          const rawCandidate = Array.isArray(listPayload?.items) && listPayload.items[0] ? listPayload.items[0] : listPayload?.item ?? listPayload?.product ?? listPayload?.data ?? null;
          const productFromList = normalizeProduct(rawCandidate);
          if (productFromList) {
            console.log('[proxy] fallback found product for', id);
            return jsonUtf8({ ok: true, id, product: productFromList }, { status: 200 });
          }
          console.log('[proxy] fallback did not find a product for', id, 'via single list result; payload keys=', Object.keys(listPayload || {}));
          if (listPayload) console.log('[proxy] listPayload sample:', JSON.stringify(listPayload).slice(0,2000));
          console.log('[proxy] attempting paged scan');
        }
        // try /products?id= and /products?_id= as alternative lookups
        const altQueries = [`id=${encodeURIComponent(id)}`, `_id=${encodeURIComponent(id)}`];
    for (const q of altQueries) {
          try {
      const altUrl = `${UPSTREAM}/products?${q}&limit=1`;
      console.log('[proxy] fallback alt-url ->', altUrl);
      const altRes = await tryFetchWithRetries(altUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' }, 1, 150);
            if (!altRes.ok) continue;
            let altPayload: any = null;
            try { altPayload = await altRes.json(); } catch (e) { altPayload = null; }
            const rawCandidate2 = Array.isArray(altPayload?.items) && altPayload.items[0] ? altPayload.items[0] : altPayload?.item ?? altPayload?.product ?? altPayload?.data ?? null;
            const mapped = normalizeProduct(rawCandidate2);
            if (mapped) return jsonUtf8({ ok: true, id, product: mapped }, { status: 200 });
          } catch (e) {
            // swallow and continue
          }
        }
        // Heuristic: scan the first few pages from the upstream list endpoint to find an item whose _id or product_id matches
        try {
          const MAX_PAGES = 5;
          const PAGE_SIZE = 50;
          for (let p = 1; p <= MAX_PAGES; p++) {
            const pageRes = await tryFetchWithRetries(`${UPSTREAM}/products?page=${p}&limit=${PAGE_SIZE}`, { headers: { Accept: 'application/json' }, cache: 'no-store' }, 1, 150);
            if (!pageRes.ok) continue;
            const pagePayload = await pageRes.json();
            const items = Array.isArray(pagePayload.items) ? pagePayload.items : [];
            for (const rawIt of items) {
              const candidateId = String(rawIt._id ?? rawIt.id ?? '');
              const candidateProductId = String(rawIt.product_id ?? rawIt.id ?? '');
              if (!candidateId && !candidateProductId) continue;
              // also allow matching by image alt or image URL substring
              const images = Array.isArray(rawIt.images) ? rawIt.images : [];
              const matchesImageAlt = images.some((img: any) => String(img?.alt ?? '') === id);
              const matchesImageUrl = images.some((img: any) => {
                try { return String(img?.url ?? '').includes(id); } catch { return false; }
              });
              if (candidateId === id || candidateProductId === id || matchesImageAlt || matchesImageUrl) {
                const found = normalizeProduct(rawIt);
                if (found) {
                  console.log('[proxy] paged-scan found product for', id, 'on page', p);
                  return jsonUtf8({ ok: true, id, product: found }, { status: 200 });
                }
              }
            }
          }
          console.log('[proxy] paged-scan did not find product for', id);
          // As a last-resort, check for a local backup mapping file that may contain legacy _id -> product_id mappings
          // As a last-resort, consult the persistent legacy_ids collection in MongoDB
          try {
            // lazy import DB helper to avoid adding startup cost in normal path
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
                  console.log('[proxy] legacy mapping (db) found for', id, '->', pid);
                  const listRes2 = await tryFetchWithRetries(`${UPSTREAM}/products?product_id=${encodeURIComponent(pid)}&limit=1`, { headers: { Accept: 'application/json' }, cache: 'no-store' }, 2, 200);
                  if (listRes2.ok) {
                    const payload2 = await listRes2.json();
                    const rawCandidate2 = Array.isArray(payload2.items) && payload2.items[0] ? payload2.items[0] : payload2.item ?? payload2.product ?? payload2.data ?? null;
                    const mapped = normalizeProduct(rawCandidate2);
                    if (mapped) return jsonUtf8({ ok: true, id, product: mapped }, { status: 200 });
                  }
                }
              } finally {
                try { await client.close(); } catch(e){}
              }
            }
          } catch (e) {
            console.error('[proxy] legacy db lookup failed', e && e.message ? e.message : e);
          }

          // If DB lookup did not yield a mapping, fall back to local tmp files (permits environments without MONGO_URI)
          try {
            const candidates = [
              path.resolve(process.cwd(), 'tmp_products_colors_backup.json'),
              path.resolve(process.cwd(), 'tmp_products_backup.json'),
              path.resolve(process.cwd(), 'tmp_image_report.json')
            ];
            for (const file of candidates) {
              if (!fs.existsSync(file)) continue;
              try {
                const raw = fs.readFileSync(file, 'utf8');
                const data = JSON.parse(raw);
                const products = data.products ?? data.items ?? data;
                if (!Array.isArray(products)) continue;
                const foundEntry = products.find((p: any) => String(p._id) === String(id));
                  if (foundEntry && (foundEntry.product_id || foundEntry.productId || foundEntry.id)) {
                  const pid = String(foundEntry.product_id ?? foundEntry.productId ?? foundEntry.id);
                  console.log('[proxy] legacy mapping found for', id, '-> product_id', pid, 'from', file);
                  const listRes2 = await tryFetchWithRetries(`${UPSTREAM}/products?product_id=${encodeURIComponent(pid)}&limit=1`, { headers: { Accept: 'application/json' }, cache: 'no-store' }, 2, 200);
                  if (listRes2.ok) {
                    const payload2 = await listRes2.json();
                    const rawCandidate2 = Array.isArray(payload2.items) && payload2.items[0] ? payload2.items[0] : payload2.item ?? payload2.product ?? payload2.data ?? null;
                    const mapped = normalizeProduct(rawCandidate2);
                    if (mapped) return jsonUtf8({ ok: true, id, product: mapped }, { status: 200 });
                  }
                }
              } catch (e) {
                // ignore parse errors and continue
              }
            }
          } catch (e) {
            // ignore
          }
        } catch (e) {
          console.error('[proxy] paged-scan failed', e && e.message ? e.message : e);
        }
      } catch (e) {
        console.error('[proxy] fallback fetch failed', e && e.message ? e.message : e);
        // fall through to error response below
      }
    }
    // If the upstream single-item endpoint returned 404 and our fallbacks didn't find it,
    // surface 404 to the caller (not a 502) to indicate the item is genuinely missing.
    if (r.status === 404) {
      return jsonUtf8({ ok: false, error: "not_found" }, { status: 404 });
    }
    return jsonUtf8({ ok: false, error: `upstream ${r.status}` }, { status: 502 });
  }

  const payload = await r.json();
  const raw = payload?.item ?? payload?.product ?? payload?.data ?? payload;
  const product = normalizeProduct(raw);
  if (!product) {
    console.warn('[proxy:/api/admin-api/products/:id] normalizeProduct failed for id', id, 'raw:', JSON.stringify(raw).slice(0, 2000));
    return jsonUtf8({ ok: false, error: "not_found" }, { status: 404 });
  }

  return jsonUtf8({ ok: true, id, product }, { status: 200 });
}

export async function HEAD(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  return new Response(null, { status: 200, headers: { "x-item-id": id, "X-Content-Type-Options": "nosniff" } });
}
