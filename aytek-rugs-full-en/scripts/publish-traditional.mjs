import 'dotenv/config';
import '../server/db.js';
import fs from 'fs';
import Product from '../server/models/Product.js';
import Category from '../server/models/Category.js';

const DESC_CSV = './descriptions.csv'; // optional CSV with headers: product_id,description_html

async function loadDescriptions() {
  if (!fs.existsSync(DESC_CSV)) return new Map();
  const raw = fs.readFileSync(DESC_CSV, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(',').map(h=>h.trim());
  const map = new Map();
  for (const l of lines) {
    const cols = l.split(',');
    const obj = {};
    for (let i=0;i<header.length;i++) obj[header[i]] = (cols[i]||'').trim();
    if (obj.product_id) map.set(String(obj.product_id), obj.description_html || '');
  }
  return map;
}

async function run() {
  console.log('Upserting category: traditional');
  const cat = await Category.findOneAndUpdate(
    { slug: 'traditional' },
    { $set: { name: 'Traditional', active: true, slug: 'traditional' } },
    { upsert: true, new: true }
  );
  console.log('Category id:', cat._id.toString());

  const descMap = await loadDescriptions();
  if (descMap.size) console.log('Loaded', descMap.size, 'descriptions from', DESC_CSV);

  console.log('Finding products with images...');
  const cursor = Product.find({ 'images.0': { $exists: true } }).cursor();
  let total = 0, updated = 0, failed = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    total++;
    const upd = {};
    // ensure both collection keys are present
    upd.$addToSet = { collections: { $each: ['traditional', 'traditional-collection'] } };
    // publish
    upd.$set = { status: 'active', visibility: 'public' };
    // optional description
    const desc = descMap.get(String(doc.product_id));
    if (desc) upd.$set.description_html = desc;

    try {
      const res = await Product.updateOne({ _id: doc._id }, upd);
      if (res.modifiedCount || res.upsertedCount) updated++; else updated++; // count as updated even if noop
    } catch (err) {
      failed++;
      console.error('failed update', doc.product_id, err.message);
    }
  }

  console.log('Done. total:', total, 'updated:', updated, 'failed:', failed);
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(2)});
