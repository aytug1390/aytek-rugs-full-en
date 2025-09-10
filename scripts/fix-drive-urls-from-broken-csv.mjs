#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { MongoClient } from 'mongodb';

const CSV = path.resolve(process.cwd(), 'tmp', 'broken-drive-urls.csv');
if (!fs.existsSync(CSV)) {
  console.error('CSV not found:', CSV);
  process.exit(1);
}

async function main(){
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  // match mode: 'loose' (default) or 'id' (compare extracted Drive file IDs)
  const matchArg = args.find(a => a.startsWith('--match='));
  const matchMode = matchArg ? matchArg.split('=')[1] : 'loose';
  const planOnly = !apply; // default to safe plan-only mode unless --apply provided

  const rl = readline.createInterface({ input: fs.createReadStream(CSV), crlfDelay: Infinity });
  const entries = [];
  for await (const line of rl) {
    if (!line || line.trim().length === 0) continue;
    // CSV format guessed: product_id,sku,orig_url,code,redirect_url
    const parts = line.split(',');
    if (parts.length < 5) continue;
    // normalize product_id: trim quotes/whitespace and remove trailing .0 if CSV treated as number
    let product_id = parts[0].trim().replace(/^"|"$/g, '');
    // if looks like a number with .0 (eg 10002.0), convert to integer string
    if (/^\d+\.0+$/.test(product_id)) {
      product_id = String(parseInt(product_id, 10));
    }
    const orig = parts[2].trim();
    const redirect = parts[4].trim();
    // skip empty originals
    if (!orig) continue;
  // skip header-like rows or obvious labels (use normalized product_id)
  const pidLower = product_id && product_id.toLowerCase ? product_id.toLowerCase() : '';
  if (pidLower === 'product_id' || pidLower === 'sku' || pidLower === 'id' || pidLower === 'productid') continue;
    entries.push({ product_id, orig, redirect });
  }

  // group by product_id
  const bySku = entries.reduce((acc,e)=>{ (acc[e.product_id] ||= []).push(e); return acc; }, {});

  // produce a non-destructive plan file for review
  const plan = Object.keys(bySku).map(sku=>({ sku, mappings: bySku[sku].map(l=>({ orig: l.orig, redirect: l.redirect })) }));
  const outDir = path.resolve(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const planPath = path.join(outDir, 'drive-url-plan.json');
  fs.writeFileSync(planPath, JSON.stringify({ generatedAt: new Date().toISOString(), plan }, null, 2));
  console.log('Wrote plan to', planPath);

  if (planOnly){
    console.log('Plan-only mode. Run with --apply to perform DB updates.');
    return;
  }

  // --apply was provided; attempt DB updates using native driver (avoid Mongoose buffering issues)
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aytek-rugs';
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 60000,
    tls: true,
  });

  const results = [];
  try {
    await client.connect();
    const db = client.db();
    const coll = db.collection('products');

    for (const sku of Object.keys(bySku)){
      const doc = await coll.findOne({ product_id: String(sku) });
      if (!doc) { results.push({ sku, ok: false, reason: 'not found' }); continue; }
      let changed = false;
      const lines = bySku[sku];
        if (Array.isArray(doc.images) && doc.images.length){
          // helper to extract Google Drive file id from a url
          const extractDriveId = (s) => {
            if (!s) return null;
            // common patterns: id=..., /d/<id>/, open?id=..., file/d/<id>/
            const patterns = [ /[?&]id=([a-zA-Z0-9_-]{10,})/, /\/d\/([a-zA-Z0-9_-]{10,})\//, /file\/d\/([a-zA-Z0-9_-]{10,})\//, /open\?id=([a-zA-Z0-9_-]{10,})/i ];
            for (const p of patterns){
              const m = String(s).match(p);
              if (m && m[1]) return m[1];
            }
            return null;
          };

          for (let i=0;i<doc.images.length;i++){
            const u = (doc.images[i].url||'').trim();
            if (!u) continue;
            for (const l of lines){
              let isMatch = false;
              if (matchMode === 'id'){
                const origId = extractDriveId(l.orig);
                const uId = extractDriveId(u);
                if (origId && uId && origId === uId) isMatch = true;
              } else {
                // loose/default behavior: loose substring/equals matching
                if (u === l.orig || u.includes(l.orig) || l.orig.includes(u)) isMatch = true;
              }

              if (isMatch){
                doc.images[i].url = l.redirect || l.orig;
                changed = true;
                break;
              }
            }
          }
        }
      if (changed){
        await coll.updateOne({ _id: doc._id }, { $set: { images: doc.images } });
        results.push({ sku, ok: true, updated: true, changedCount: doc.images.length });
      } else {
        results.push({ sku, ok: true, updated: false, reason: 'no matching image URLs' });
      }
    }

    console.log(JSON.stringify(results, null, 2));
    // persist apply results for audit
    try {
      const outPath = path.join(outDir, 'drive-url-apply-results.json');
      fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
      console.log('Wrote apply results to', outPath);
    } catch (e) {
      console.error('Failed to write apply results file:', e && e.message ? e.message : e);
    }
  } finally {
    await client.close().catch(()=>{});
  }
}

main().catch(err=>{ console.error(err); process.exit(2); });
