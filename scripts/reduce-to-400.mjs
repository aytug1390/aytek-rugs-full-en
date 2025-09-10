import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function run(){
  console.log('[reduce] connected to DB');
  const total = await Product.countDocuments().exec();
  const liveQuery = { status: { $ne: 'draft' }, visibility: { $ne: 'private' } };
  const liveCount = await Product.countDocuments(liveQuery).exec();
  const hasImageQuery = { 'images.0.url': { $exists: true, $ne: '' } };
  const liveHasImageQuery = { ...liveQuery, ...hasImageQuery };
  const liveHasImageCount = await Product.countDocuments(liveHasImageQuery).exec();

  console.log('[reduce] totals: all=', total, 'live=', liveCount, 'live_with_image=', liveHasImageCount);

  const target = 400;
  if (liveHasImageCount <= target){
    console.log('[reduce] live products with images already <=', target, '- nothing to do');
    process.exit(0);
  }

  const excess = liveHasImageCount - target;
  console.log('[reduce] need to mark', excess, 'products draft/private to reach', target);

  // choose candidates: live products with image, sorted by updatedAt ascending (oldest first)
  const candidates = await Product.find(liveHasImageQuery).sort({ updatedAt: 1 }).limit(excess).lean().exec();
  console.log('[reduce] selected', candidates.length, 'candidates to mark');

  const outDir = path.resolve('tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const backupPath = path.join(outDir, `reduced-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(candidates, null, 2), 'utf8');
  console.log('[reduce] backup written to', backupPath);

  let updated=0, failed=0;
  for (const c of candidates){
    try{
      const res = await Product.updateOne({ _id: c._id }, { $set: { status: 'draft', visibility: 'private' } }).exec();
      if (res.modifiedCount && res.modifiedCount > 0) updated++;
    }catch(e){
      console.error('[reduce] failed', c.product_id, e.message);
      failed++;
    }
  }

  console.log('[reduce] done. selected=', candidates.length, 'updated=', updated, 'failed=', failed);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
