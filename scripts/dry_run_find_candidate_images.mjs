#!/usr/bin/env node
/* Enhanced dry-run: for products missing image_url, try to discover candidate image from various fields.
   - Checks: product.image_url, images[].url, images[].src, images[].driveId (converted to drive URL), description_html (regex for drive/https images)
   - Prints JSON per candidate with fields: _id, product_id, title, candidate_url, reason
   - Usage: node scripts/dry_run_find_candidate_images.mjs --limit 20
*/
import { MongoClient } from 'mongodb';
import process from 'process';

const argv = process.argv.slice(2);
let limit = 20;
for (let i=0;i<argv.length;i++){
  if (argv[i]==='--limit' && argv[i+1]){ limit = Number(argv[i+1]); }
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
if (!MONGO_URI){
  console.error('MONGO_URI not set and no default available. Set MONGO_URI env var.');
  process.exit(2);
}

function driveUrlFromId(id){
  if(!id) return null;
  // Accept raw id or full drive url
  if (/^https?:\/\//i.test(id)) return id;
  return `https://drive.google.com/uc?export=view&id=${id}`;
}

function findImgInHtml(html){
  if(!html) return null;
  const re = /<img[^>]+src=["']([^"']+)["']/ig;
  let m;
  while ((m = re.exec(html)) !== null) {
    if(m[1]) return m[1];
  }
  // fallback: find any https url ending with common image ext
  const re2 = /(https?:\/\/[^\s\"']+\.(?:jpg|jpeg|png|webp|gif))/ig;
  const m2 = re2.exec(html);
  if(m2) return m2[1];
  return null;
}

(async ()=>{
  console.log('[dry-run-find] connecting to', MONGO_URI.startsWith('mongodb://') ? '[local]' : MONGO_URI.replace(/(mongodb\+srv:\/\/[^:]+:)[^@]+(@.*)/, '$1***$2'));
  const client = new MongoClient(MONGO_URI, {  });
  try{
    await client.connect();
    const dbName = process.env.MONGO_DB || (new URL(MONGO_URI.replace('mongodb+srv://','mongodb://')).pathname.replace(/^\//,'')) || 'aytekdb';
    const db = client.db(dbName);
    const products = db.collection('products');

    const q = {
      $and: [
        { $or: [ { image_url: { $exists: false } }, { image_url: null }, { image_url: '' } ] },
        // include those that have images array OR description_html potentially containing images
        { $or: [ { images: { $exists: true, $ne: [] } }, { description_html: { $exists: true, $ne: '' } } ] }
      ]
    };

    const cursor = products.find(q).limit(limit);
    let count = 0;
    for await (const p of cursor){
      count++;
      let candidate = null;
      let reason = null;
      // image_url explicit
      if (p.image_url && String(p.image_url).trim()){
        candidate = p.image_url; reason = 'image_url';
      }
      // scan images[]
      if(!candidate && Array.isArray(p.images) && p.images.length){
        for (const it of p.images){
          const u = it?.url || it?.src || it?.image || it?.driveUrl;
          if (u && String(u).trim()){ candidate = u; reason = 'images[].url/src'; break; }
          if (it?.driveId){ candidate = driveUrlFromId(it.driveId); reason = 'images[].driveId'; break; }
        }
      }
      // try known legacy fields
      if(!candidate){
        const alt = p?.images0 || p?.primary_image || p?.img || p?.photo;
        if (alt && String(alt).trim()){ candidate = alt; reason = 'legacy-field'; }
      }
      // scan description_html
      if(!candidate && p.description_html){
        const found = findImgInHtml(p.description_html);
        if(found){ candidate = found; reason = 'description_html img'; }
      }

      // normalize candidate if drive id
      if(candidate && /^(?:[A-Za-z0-9_-]{20,})$/.test(candidate)){
        candidate = driveUrlFromId(candidate);
      }

      const out = {
        _id: p._id?.toString?.() || String(p._id),
        product_id: p.product_id || null,
        title: p.title || null,
        candidate_url: candidate || null,
        reason: reason || null,
      };
      console.log(JSON.stringify(out));
    }
    if (count===0) console.log('[dry-run-find] no matching products found');
    else console.log(`[dry-run-find] listed ${count} products (limit ${limit})`);
  }catch(err){
    console.error('[dry-run-find] error', err.message || err);
    process.exit(3);
  }finally{
    await client.close();
  }
})();
