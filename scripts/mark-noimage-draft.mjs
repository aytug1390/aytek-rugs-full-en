import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function run(){
  console.log('[mark] connected, finding products with no images');
  // find products where images.0.url is missing or empty
  const query = { $or: [ { 'images.0.url': { $exists: false } }, { 'images.0.url': '' } ] };
  const products = await Product.find(query).lean().exec();
  console.log('[mark] found', products.length, 'products');
  const outDir = path.resolve('tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const backupPath = path.join(outDir, 'no-image-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(products, null, 2), 'utf8');
  console.log('[mark] backup written to', backupPath);

  if (products.length === 0){
    console.log('[mark] nothing to update');
    process.exit(0);
  }

  // Update each product: set status=draft and visibility=private, also remove from public collections maybe
  let updated=0, failed=0;
  for (const p of products){
    try{
      const res = await Product.updateOne({ _id: p._id }, { $set: { status: 'draft', visibility: 'private' } }).exec();
      if (res.modifiedCount && res.modifiedCount > 0) updated++;
    }catch(e){
      console.error('[mark] failed', p.product_id, e.message);
      failed++;
    }
  }

  console.log('[mark] done. total=', products.length, 'updated=', updated, 'failed=', failed);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
