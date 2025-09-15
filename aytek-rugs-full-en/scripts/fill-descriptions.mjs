#!/usr/bin/env node
// scripts/fill-descriptions.mjs
// Dry-run updates: for products with empty description_html, propose a new value built from description/long_description/short_description/title

const API_ORIGIN = process.env.ADMIN_API_ORIGIN || process.env.NEXT_PUBLIC_PROXY_ORIGIN || 'http://127.0.0.1:3000';
const PAGE_SIZE = 200;
const DRY_RUN = process.env.DRY_RUN !== 'false'; // default true, set DRY_RUN=false to perform writes

function pickDescription(p) {
  // prioritize existing rich html fields
  if (p.description_html && String(p.description_html).trim()) return null; // already present
  const candidates = [p.description_html, p.description, p.long_description, p.short_description, p.summary, p.title, p.name, p.product_id];
  for (const c of candidates) {
    if (c && String(c).trim()) return String(c).trim();
  }
  return '';
}

async function fetchPage(page=1) {
  const url = `${API_ORIGIN}/api/admin-api/products?page=${page}&pageSize=${PAGE_SIZE}`;
  const res = await fetch(url, { headers:{ Accept:'application/json' } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function updateProduct(id, body) {
  const url = `${API_ORIGIN}/api/admin-api/products/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type':'application/json', Accept:'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Update failed ${url}: ${res.status}`);
  return res.json();
}

(async function main(){
  console.log('API origin:', API_ORIGIN, 'DRY_RUN=', DRY_RUN);
  let page=1; let changed=0; let total=0; let toChange=[];
  while(true) {
    let body;
    try { body = await fetchPage(page); } catch(e) { console.error('Fetch page error', e); process.exit(1); }
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) break;
    for (const p of items) {
      total++;
      const pick = pickDescription(p);
      if (pick !== null && pick !== '') {
        // propose update
        toChange.push({ _id: p._id, product_id: p.product_id, title: p.title, newDescription: pick });
      }
    }
    if (items.length < PAGE_SIZE) break; page++;
  }
  console.log('Total products scanned:', total);
  console.log('Products to update (missing description_html):', toChange.length);
  if (toChange.length === 0) return;
  console.log('Sample:', toChange.slice(0,5));
  if (DRY_RUN) { console.log('Dry run enabled; to perform updates set DRY_RUN=false'); process.exit(0); }

  // perform updates
  for (const t of toChange) {
    try {
      const body = { description_html: t.newDescription };
      await updateProduct(t._id, body);
      console.log('Updated', t.product_id || t._id);
      changed++;
    } catch (e) {
      console.error('Failed to update', t.product_id || t._id, e);
    }
  }
  console.log('Done. Updated', changed, 'products.');
})();
