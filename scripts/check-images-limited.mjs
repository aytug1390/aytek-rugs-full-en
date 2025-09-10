#!/usr/bin/env node
import fs from 'fs';
const API_ORIGIN = process.env.ADMIN_API_ORIGIN || process.env.NEXT_PUBLIC_PROXY_ORIGIN || 'http://127.0.0.1:3000';
const OUT = './tmp_image_report_limited.json';
async function fetchPage(page = 1, pageSize = 200) {
  const url = `${API_ORIGIN}/api/admin-api/products?page=${page}&pageSize=${pageSize}`;
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
  return {
    primary: `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`,
    fallback: `https://drive.google.com/uc?export=view&id=${id}`,
  };
}
async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.ok) return { status: res.status, ok: true };
    const g = await fetch(url, { method: 'GET', redirect: 'follow' });
    return { status: g.status, ok: g.ok };
  } catch (err) {
    return { status: null, ok: false, error: String(err) };
  }
}
(async function main(){
  console.log('Using API origin:', API_ORIGIN);
  const report = { checkedAt: new Date().toISOString(), products: [], summary: {} };
  for (let page=1; page<=2; page++) {
    console.log(`Fetching page ${page}`);
    const body = await fetchPage(page, 200);
    const items = Array.isArray(body.items) ? body.items : [];
    console.log(`Got ${items.length} items`);
    for (const p of items) {
      const prod = { product_id: p.product_id, title: p.title, images: [] };
      const images = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
      for (const im of images) {
        const raw = typeof im === 'string' ? im : (im.url ?? '');
        const { primary, fallback } = driveUrls(raw, 1600);
        console.log(`  Checking product ${p.product_id} image ${raw}`);
        const primaryRes = primary ? await checkUrl(primary) : { status: null, ok: false };
        let fallbackRes = null;
        if (!primaryRes.ok && fallback) {
          fallbackRes = await checkUrl(fallback);
        }
        prod.images.push({ raw, primary, primaryRes, fallback, fallbackRes });
      }
      report.products.push(prod);
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('Wrote', OUT);
})();
