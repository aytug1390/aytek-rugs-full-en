#!/usr/bin/env node
// scripts/fetch-rug-page.mjs
// Usage: node ./scripts/fetch-rug-page.mjs 10014
import fs from 'fs';
const id = process.argv[2];
if (!id) {
  console.error('Usage: node ./scripts/fetch-rug-page.mjs <productId>');
  process.exit(2);
}
const ORIGIN = process.env.NEXT_PUBLIC_PROXY_ORIGIN || 'http://127.0.0.1:3000';
const url = `${ORIGIN.replace(/\/$/, '')}/rug/${encodeURIComponent(id)}`;
console.log('Fetching', url);
(async ()=>{
  try {
    const res = await fetch(url, { headers: { Accept: 'text/html' }, redirect: 'follow' });
    console.log('HTTP', res.status, res.statusText);
    const text = await res.text();
    console.log('BODY (first 4000 chars):');
    console.log(text.slice(0, 4000));
    if (text.length > 4000) console.log('\n... (truncated)');
  } catch (err) {
    console.error('Fetch error:', err);
    process.exit(1);
  }
})();
