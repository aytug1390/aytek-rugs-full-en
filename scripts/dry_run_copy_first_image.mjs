#!/usr/bin/env node
/* Dry-run script: list up to N products where image_url is missing/empty but images[0].url exists.
   - Does not write to DB. Prints JSON lines with _id, product_id, title, images[0].url, current image_url
   - Uses native MongoDB driver; respects MONGO_URI / MONGODB_URI env vars.
   - Usage: node scripts/dry_run_copy_first_image.mjs --limit 10
*/
import { MongoClient } from 'mongodb';
import process from 'process';

const argv = process.argv.slice(2);
let limit = 10;
for (let i=0;i<argv.length;i++){
  if (argv[i]==='--limit' && argv[i+1]){ limit = Number(argv[i+1]); }
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
if (!MONGO_URI){
  console.error('MONGO_URI not set and no default available. Set MONGO_URI env var.');
  process.exit(2);
}

(async ()=>{
  console.log('[dry-run] connecting to', MONGO_URI.startsWith('mongodb://') ? '[local]' : MONGO_URI.replace(/(mongodb\+srv:\/\/[^:]+:)[^@]+(@.*)/, '$1***$2'));
  const client = new MongoClient(MONGO_URI, {  });
  try{
    await client.connect();
    const dbName = process.env.MONGO_DB || (new URL(MONGO_URI.replace('mongodb+srv://','mongodb://')).pathname.replace(/^\//,'')) || 'aytekdb';
    const db = client.db(dbName);
    const products = db.collection('products');

    const q = {
      $and: [
        { $or: [ { image_url: { $exists: false } }, { image_url: null }, { image_url: '' } ] },
        { images: { $exists: true, $ne: [] } }
      ]
    };

    const cursor = products.find(q).limit(limit);
    let count = 0;
    for await (const p of cursor){
      count++;
      const firstImgUrl = (Array.isArray(p.images) && p.images.length)? (p.images[0].url || p.images[0].src || '') : '';
      const out = {
        _id: p._id?.toString?.() || String(p._id),
        product_id: p.product_id || p._id || null,
        title: p.title || null,
        current_image_url: p.image_url || null,
        images0_url: firstImgUrl || null,
      };
      console.log(JSON.stringify(out));
    }
    if (count===0) console.log('[dry-run] no matching products found');
    else console.log(`[dry-run] listed ${count} products (limit ${limit})`);
  }catch(err){
    console.error('[dry-run] error', err.message || err);
    process.exit(3);
  }finally{
    await client.close();
  }
})();
