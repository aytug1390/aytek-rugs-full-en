import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import '../server/db.js';
import Product from '../server/models/Product.js';

const CSV_IN = path.join(process.cwd(), 'missing-skus-report.csv');

async function run() {
  if (!fs.existsSync(CSV_IN)) {
    console.error('missing-skus-report.csv not found at', CSV_IN);
    process.exit(2);
  }

  const raw = fs.readFileSync(CSV_IN, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  lines.shift(); // header
  const skus = lines.map(l => l.split(',')[0].trim()).filter(Boolean);
  console.log('Will create placeholders for', skus.length, 'SKUs');

  let created = 0, existed = 0;
  for (const sku of skus) {
    const id = sku.replace(/\.0$/, '');
    const found = await Product.findOne({ product_id: String(id) }).lean().exec();
    if (found) { existed++; continue; }
    const p = new Product({
      product_id: String(id),
      title: `Placeholder ${id}`,
      description_html: '',
      availability: 'in stock',
      brand: 'Aytek Rugs',
      price: { amount: 0, currency: 'USD' },
      sale_price: { amount: 0, active: false },
      images: [],
      tags: [],
      collections: ['traditional-collection'],
      status: 'draft',
      visibility: 'private'
    });
    await p.save();
    created++;
  }

  console.log('Placeholders created:', created, 'already existed:', existed);
}

run().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(2); });
