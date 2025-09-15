#!/usr/bin/env node
// scripts/check-images.mjs
// Fetch all products from admin API and check each image URL (thumbnail then uc fallback)
import fs from 'fs';

const API_ORIGIN = process.env.ADMIN_API_ORIGIN || process.env.NEXT_PUBLIC_PROXY_ORIGIN || 'http://127.0.0.1:3000';
const OUT = './tmp_image_report.json';

const PAGE_SIZE = 200;

async function fetchPage(page = 1, pageSize = PAGE_SIZE) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    status: 'active',
    visibility: 'public',
  });
  const url = `${API_ORIGIN}/api/admin-api/products?` + params.toString();
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
  return res.json();
}

function extractDriveId(input) {
  if (!input) return null;
  const m1 = input.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = input.match(/\/d\/([A-Za-z0-9_-]+)(?:[/?#]|$)/);
  if (m2) return m2[1];
  return null;
}

function driveUrls(rawUrl, size = 1600) {
  const id = extractDriveId(rawUrl);
  if (!id) return { primary: null, fallback: null };
  const base = API_ORIGIN.replace(/\/$/, '');
  return {
    primary: `${base}/api/drive?id=${encodeURIComponent(id)}&sz=w${size}`,
    fallback: `${base}/api/drive?id=${encodeURIComponent(id)}`,
  };
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.ok) return { status: res.status, ok: true };
    // Some servers don't support HEAD; try GET with range
    const g = await fetch(url, { method: 'GET', redirect: 'follow' });
    return { status: g.status, ok: g.ok };
  } catch (err) {
    return { status: null, ok: false, error: String(err) };
  }
}

;(async function main(){
  console.log('Using API origin:', API_ORIGIN);
  const report = { checkedAt: new Date().toISOString(), products: [], summary: {} };
  let page = 1; let totalFetched = 0; let total = Infinity;

  while (true) {
    console.log(`Fetching page ${page}`);
    let body;
    try { body = await fetchPage(page, PAGE_SIZE); } catch (err) { console.error('Fetch error', err); process.exit(1); }
    const items = Array.isArray(body.items) ? body.items : [];
    if (page === 1 && typeof body.total === 'number') total = body.total;
    if (!items.length) break;
    for (const p of items) {
      const prod = { product_id: p.product_id, _id: p._id, title: p.title, images: [] };
      const images = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
      for (const im of images) {
        const raw = typeof im === 'string' ? im : (im.url ?? '');
        const { primary, fallback } = driveUrls(raw, 1600);
        const primaryRes = primary ? await checkUrl(primary) : { status: null, ok: false };
        let fallbackRes = null;
        if (!primaryRes.ok && fallback) {
          fallbackRes = await checkUrl(fallback);
        }
        prod.images.push({ raw, primary, primaryRes, fallback, fallbackRes });
      }
      report.products.push(prod);
      totalFetched++;
    }
    if (Number.isFinite(total) && totalFetched >= total) break;
    page++;
  }
  // Summarize
  let productsWithAllImagesOk = 0;
  let productsWithMissingImages = 0;
  let totalImages = 0, okImages = 0;
  for (const p of report.products) {
    let allOk = true; let anyMissing = false;
    for (const im of p.images) {
      totalImages++;
      const ok = (im.primaryRes && im.primaryRes.ok) || (im.fallbackRes && im.fallbackRes.ok);
      if (ok) okImages++; else { allOk = false; anyMissing = true; }
    }
    if (p.images.length === 0) anyMissing = true;
    if (allOk && p.images.length>0) productsWithAllImagesOk++;
    if (anyMissing) productsWithMissingImages++;
  }
  report.summary = { totalProducts: report.products.length, totalImages, okImages, productsWithAllImagesOk, productsWithMissingImages };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('Report written to', OUT);
  console.log('Summary:', report.summary);
})();
