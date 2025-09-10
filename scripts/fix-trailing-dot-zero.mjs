#!/usr/bin/env node
// scripts/fix-trailing-dot-zero.mjs
// Load .env.local first so server/db.js can read MONGO_URI, then fix trailing ".0" in some string fields.
import fs from 'fs';
import path from 'path';

// load .env.local if present
const envPath = path.resolve(new URL('.', import.meta.url).pathname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const m = line.match(/^([^=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    v = v.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    process.env[k] = v;
  }
}

import '../server/db.js';
import Product from '../server/models/Product.js';

async function main() {
  console.log('[fix] starting');
  const re = /\.0+$/;
  const query = { $or: [ { product_id: { $regex: re } }, { title: { $regex: re } }, { 'images.alt': { $regex: re } } ] };
  const cursor = Product.find(query).cursor();
  let scanned = 0, updated = 0;
  for await (const p of cursor) {
    scanned++;
    const upd = {};
    if (typeof p.product_id === 'string' && re.test(p.product_id)) {
      upd.product_id = p.product_id.replace(/\.0+$/, '');
    }
    if (typeof p.title === 'string' && re.test(p.title)) {
      upd.title = p.title.replace(/\.0+$/, '');
    }
    if (Array.isArray(p.images)) {
      const newImages = p.images.map(img => {
        if (!img) return img;
        const out = { ...img };
        if (out.alt && typeof out.alt === 'string' && re.test(out.alt)) {
          out.alt = out.alt.replace(/\.0+$/, '');
        }
        return out;
      });
      // detect change
      if (JSON.stringify(newImages) !== JSON.stringify(p.images)) upd.images = newImages;
    }

    if (Object.keys(upd).length > 0) {
      try {
        await Product.updateOne({ _id: p._id }, { $set: upd });
        updated++;
        console.log('[fix] updated', p._id.toString(), upd);
      } catch (e) {
        console.error('[fix] failed update', p._id.toString(), e.message);
      }
    }
  }
  console.log('[fix] done scanned=', scanned, 'updated=', updated);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(2); });
