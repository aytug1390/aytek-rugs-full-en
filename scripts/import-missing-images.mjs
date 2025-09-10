import 'dotenv/config';
import '../server/db.js';
import fs from 'fs';
import Product from '../server/models/Product.js';

const CSV_PATH = './missing_images.csv';

async function run() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV not found at', CSV_PATH);
    process.exit(2);
  }

  // quick CSV parser (assumes simple, no quoted newlines)
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(',').map(h => h.trim());
  const rows = lines.map(l => {
    const cols = l.split(',');
    const obj = {};
    for (let i=0;i<header.length;i++) obj[header[i]] = (cols[i]||'').trim();
    return obj;
  });

  // group by product_id
  const map = new Map();
  for (const r of rows) {
    const sku = (r.product_id || '').trim();
    if (!sku) continue;
    const arr = map.get(sku) || [];
    arr.push(r);
    map.set(sku, arr);
  }

  console.log('Found', map.size, 'SKUs in CSV');
  let updated = 0, missing = 0;
  for (const [sku, items] of map.entries()) {
    // sort by order
    items.sort((a,b)=> Number(a.order||0) - Number(b.order||0));
    const images = items.map(it => ({ url: it.url, alt: it.alt || '', isPrimary: String(it.isPrimary).toLowerCase() === 'true' }));
    const primary = images.find(i=>i.isPrimary) || images[0];
    try {
      const doc = await Product.findOneAndUpdate({ product_id: String(sku) }, { $set: { images, main_image: primary?.url || '' } }, { new: true });
      if (doc) updated++; else missing++;
    } catch (err) {
      console.error('error updating', sku, err.message);
    }
  }

  console.log('Done. updated:', updated, 'missing:', missing);
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(2)});
