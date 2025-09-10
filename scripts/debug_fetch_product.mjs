import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fetchProduct(id) {
  const proxy = process.env.NEXT_PUBLIC_PROXY_ORIGIN || 'http://127.0.0.1:3000';
  const url = `${proxy}/api/admin-api/products?product_id=${encodeURIComponent(id)}&limit=1`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) { console.error('fetch failed', res.status); process.exit(2); }
  const body = await res.json();
  const item = Array.isArray(body.items) && body.items[0] ? body.items[0] : null;
  return item;
}

(async()=>{
  const p = await fetchProduct('16194');
  console.log('got product', !!p, 'images length=', Array.isArray(p?.images)?p.images.length:(p?.images?1:0));
  console.log('sample images:', (p?.images || []).slice(0,5));
})();
