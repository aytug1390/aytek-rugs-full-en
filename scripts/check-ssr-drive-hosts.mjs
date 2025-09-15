#!/usr/bin/env node
// scripts/check-ssr-drive-hosts.mjs
// Reads ./tmp_image_report.json if present (recommended), otherwise fetches products via admin API.
// For each product it fetches the SSR page at /rug/:id and searches the HTML for any raw Drive hostnames
// (drive.google.com, drive.usercontent.google.com). Produces ./tmp_ssr_drive_check.json and a console summary.

import fs from 'fs';

const API_ORIGIN = process.env.ADMIN_API_ORIGIN || process.env.NEXT_PUBLIC_PROXY_ORIGIN || 'http://127.0.0.1:3000';
const REPORT_IN = './tmp_image_report.json';
const REPORT_OUT = './tmp_ssr_drive_check.json';
const PAGE_SIZE = 200;
const CONCURRENCY = 10; // number of parallel page fetches

function exists(path) {
  try { return fs.existsSync(path); } catch (e) { return false; }
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Failed fetching ${url}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchProductsFromApi() {
  console.log('No local report found — fetching products from admin API at', API_ORIGIN);
  let items = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), status: 'active', visibility: 'public' });
    const url = `${API_ORIGIN}/api/admin-api/products?` + params.toString();
    console.log('Fetching', url);
    const body = await fetchJson(url);
    const pageItems = Array.isArray(body.items) ? body.items : [];
    items.push(...pageItems);
    if (!pageItems.length || (typeof body.total === 'number' && items.length >= body.total)) break;
    page++;
  }
  return items;
}

function pickId(product) {
  // prefer product_id (numeric/string) else _id
  return product.product_id ?? product._id ?? product.id ?? null;
}

function snippetAround(text, idx, radius = 200) {
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + radius);
  return text.slice(start, end).replace(/\s+/g, ' ');
}

async function checkPageForDriveHosts(id) {
  const url = `${API_ORIGIN.replace(/\/$/, '')}/rug/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'text/html' }, redirect: 'follow' });
    if (!res.ok) return { id, ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    const text = await res.text();
    const rx = /drive\.google\.com|drive\.usercontent\.google\.com/gi;
    const matches = [];
    let m;
    while ((m = rx.exec(text)) !== null) {
      matches.push({ index: m.index, snippet: snippetAround(text, m.index, 200) });
      // prevent extremely long loops
      if (matches.length > 10) break;
    }
    return { id, ok: matches.length === 0, matches };
  } catch (err) {
    return { id, ok: false, error: String(err) };
  }
}

async function run() {
  let products = [];
  if (exists(REPORT_IN)) {
    console.log('Reading local report', REPORT_IN);
    try {
      const raw = fs.readFileSync(REPORT_IN, 'utf8');
      const r = JSON.parse(raw);
      products = Array.isArray(r.products) ? r.products : [];
    } catch (err) {
      console.error('Failed to read/parse', REPORT_IN, err);
      products = await fetchProductsFromApi();
    }
  } else {
    products = await fetchProductsFromApi();
  }

  // Normalize to array of ids
  const ids = products.map(p => pickId(p)).filter(Boolean);
  console.log('Products to check:', ids.length);

  const results = [];
  // process in batches to limit concurrency
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    console.log(`Checking batch ${i / CONCURRENCY + 1} (${batch.length} pages)`);
    const promises = batch.map(id => checkPageForDriveHosts(id));
    const res = await Promise.all(promises);
    results.push(...res);
  }

  // write output
  fs.writeFileSync(REPORT_OUT, JSON.stringify({ checkedAt: new Date().toISOString(), origin: API_ORIGIN, results }, null, 2));

  // Summary
  const fail = results.filter(r => !r.ok);
  console.log('Total checked:', results.length, 'OK:', results.length - fail.length, 'FAIL:', fail.length);
  if (fail.length) {
    console.log('First 20 failures:');
    for (const f of fail.slice(0, 20)) {
      console.log('-', f.id, f.error ? `ERROR: ${f.error}` : `matches: ${f.matches?.length ?? 0}`);
    }
  }
  console.log('Wrote', REPORT_OUT);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
