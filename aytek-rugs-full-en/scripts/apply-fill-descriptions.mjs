#!/usr/bin/env node
// scripts/apply-fill-descriptions.mjs
// Connects to Mongo (server/db.js) and updates products missing description_html

import '../server/db.js';
import Product from '../server/models/Product.js';

function pickDescription(p) {
  if (p.description_html && String(p.description_html).trim()) return null;
  const candidates = [p.description_html, p.description, p.long_description, p.short_description, p.summary, p.title, p.name, p.product_id];
  for (const c of candidates) {
    if (!c) continue;
    let s = String(c).trim();
    if (!s) continue;
    // normalize numeric-like ids that ended up with a trailing .0 (e.g. "16532.0")
    if (/^\d+\.0+$/.test(s)) {
      s = s.replace(/\.0+$/, '');
    }
    // also strip a lone decimal if present (e.g. 16532. -> 16532)
    s = s.replace(/\.$/, '');
    return s;
  }
  return '';
}

(async function main(){
  console.log('[migrate] Starting fill descriptions');
  const cursor = Product.find({ $or: [ { description_html: { $exists: false } }, { description_html: '' } ] }).cursor();
  let updated = 0; let scanned=0;
  for await (const p of cursor) {
    scanned++;
    const pick = pickDescription(p);
    if (pick !== null && pick !== '') {
      try {
        await Product.updateOne({ _id: p._id }, { $set: { description_html: pick } });
        updated++;
        if (updated % 50 === 0) console.log('[migrate] updated', updated);
      } catch (e) {
        console.error('[migrate] update failed for', p._id, e.message);
      }
    }
  }
  console.log('[migrate] done. scanned=', scanned, 'updated=', updated);
  process.exit(0);
})();
