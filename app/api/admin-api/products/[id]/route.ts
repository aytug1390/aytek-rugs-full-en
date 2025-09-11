import { NextResponse } from "next/server";

type Params = { id: string };

import fs from 'fs';
import path from 'path';
import { tryFetchWithRetries } from '../../../../../lib/adminApiProxy';

const ORIGIN = process.env.ADMIN_API_ORIGIN || "http://127.0.0.1:5000";
const KEEP = (process.env.ADMIN_API_KEEP_PREFIX || "true").toLowerCase() === "true";
const UPSTREAM = KEEP ? `${ORIGIN}/admin-api` : ORIGIN;


function normalizeProduct(raw: any) {
  if (!raw || typeof raw !== "object") return null;
  const images = Array.isArray(raw.images) ? raw.images : [];
  return {
    _id: String(raw._id ?? raw.id ?? ""),
    product_id: String(raw.product_id ?? raw.id ?? ""),
    title: String(raw.title ?? raw.name ?? ""),
    availability: String(raw.availability ?? raw.status ?? ""),
    price: raw.price ?? null,
    sale_price: raw.sale_price ?? null,
    description_html: String(raw.description_html ?? raw.description ?? ""),
    images: images.map((img: any, i: number) => ({
      url: String(img.url ?? img.src ?? ""),
      alt: String(img.alt ?? `Image ${i + 1}`),
      isPrimary: Boolean(img.isPrimary ?? i === 0),
    })),
    updatedAt: raw.updatedAt ?? null,
  };
}

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params; // Next 15: params Promise!
  console.log('[proxy:/api/admin-api/products/:id] request id ->', id);

  const r = await tryFetchWithRetries(`${UPSTREAM}/products/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!r.ok) {
    console.warn('[proxy:/api/admin-api/products/:id] upstream status', r.status, 'for id', id);
    // If the upstream single-item endpoint returns 404, try the list endpoint by product_id
    if (r.status === 404) {
      console.log('[proxy] upstream 404, attempting fallback list-by-product_id for', id);
      try {
        const listRes = await tryFetchWithRetries(`${UPSTREAM}/products?product_id=${encodeURIComponent(id)}&limit=1`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }, 2, 200);
        console.log('[proxy] fallback list endpoint status', listRes.status, 'for product_id=', id);
        if (listRes.ok) {
          const listPayload = await listRes.json();
          // attempt to extract first item
          const rawCandidate = Array.isArray(listPayload.items) && listPayload.items[0] ? listPayload.items[0] : listPayload.item ?? listPayload.product ?? listPayload.data ?? null;
          const productFromList = normalizeProduct(rawCandidate);
          if (productFromList) {
            console.log('[proxy] fallback found product for', id);
            return NextResponse.json({ ok: true, id, product: productFromList }, { status: 200 });
          }
          console.log('[proxy] fallback did not find a product for', id, 'via single list result; attempting paged scan');
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
                  return NextResponse.json({ ok: true, id, product: found }, { status: 200 });
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
                    if (mapped) return NextResponse.json({ ok: true, id, product: mapped }, { status: 200 });
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
                    if (mapped) return NextResponse.json({ ok: true, id, product: mapped }, { status: 200 });
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
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: `upstream ${r.status}` }, { status: 502 });
  }

  const payload = await r.json();
  const raw = payload?.item ?? payload?.product ?? payload?.data ?? payload;
  const product = normalizeProduct(raw);
  if (!product) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, id, product }, { status: 200 });
}

export async function HEAD(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  return new Response(null, { status: 200, headers: { "x-item-id": id, "X-Content-Type-Options": "nosniff" } });
}
