import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import '../server/db.js';
import Product from '../server/models/Product.js';

const PROJECT_ROOT = path.resolve(process.cwd());
const CSV_IN = path.join(PROJECT_ROOT, 'missing_images.csv');
const OUT = path.join(PROJECT_ROOT, 'missing-skus-report.csv');

async function run() {
  if (!fs.existsSync(CSV_IN)) {
    console.error('missing_images.csv not found at', CSV_IN);
    process.exit(2);
  }

  const raw = fs.readFileSync(CSV_IN, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(',').map(h=>h.trim());
  const skus = new Set();
  for (const l of lines) {
    const cols = l.split(',');
    const obj = {};
    for (let i=0;i<header.length;i++) obj[header[i]] = (cols[i]||'').trim();
    if (obj.product_id) skus.add(obj.product_id.replace(/\.0$/, ''));
  }

  console.log('Unique SKUs in CSV:', skus.size);
  const missing = [];
  for (const sku of skus) {
    const found = await Product.findOne({ product_id: String(sku) }).lean().exec();
    if (!found) missing.push(sku);
  }

  const outCsv = ['product_id,reason'].concat(missing.map(s=>`${s},not_in_db`)).join('\n');
  fs.writeFileSync(OUT, outCsv, 'utf8');
  console.log('Wrote', OUT, 'missing count:', missing.length);
}

run().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(2); });
