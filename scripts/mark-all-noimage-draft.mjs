import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function run(){
  console.log('[mark-all] connected, finding products with no images (images.url & main_image)');
  // find products that have neither any images[].url nor main_image
  const query = {
    $and: [
      { $nor: [ { 'images.url': { $exists: true, $ne: '' } }, { main_image: { $exists: true, $ne: '' } } ] }
    ]
  };

  const products = await Product.find(query).lean().exec();
  console.log('[mark-all] found', products.length, 'products matching no-image definition');

  const outDir = path.resolve('tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const backupPath = path.join(outDir, `no-image-full-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(products, null, 2), 'utf8');
  console.log('[mark-all] backup written to', backupPath);

  if (products.length === 0){
    console.log('[mark-all] nothing to update');
    process.exit(0);
  }

  let updated=0, failed=0;
  for (const p of products){
    try{
      const res = await Product.updateOne({ _id: p._id }, { $set: { status: 'draft', visibility: 'private' } }).exec();
      if (res.modifiedCount && res.modifiedCount > 0) updated++;
    }catch(e){
      console.error('[mark-all] failed', p.product_id, e.message);
      failed++;
    }
  }

  console.log('[mark-all] done. total=', products.length, 'updated=', updated, 'failed=', failed);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
