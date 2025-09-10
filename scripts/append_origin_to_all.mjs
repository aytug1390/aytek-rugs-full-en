#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import process from 'process';

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/aytekdb';
function parseArgs(){
  const out = { apply: false };
  for(const a of process.argv.slice(2)){
    if(a==='--apply') out.apply = true;
  }
  return out;
}

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function run(){
  const opts = parseArgs();
  const client = new MongoClient(MONGO, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db();
  const col = db.collection('products');

  const cursor = col.find({}, { projection: { product_id:1, description_html:1, description:1 } });
  let scanned=0, found=0, willUpdate=0, skippedAlready=0;
  const sampleUpdated = [];
  const originHtml = `<div class="mt-4 text-sm text-gray-700"><strong>Origin:</strong> Turkey</div>`;

  while(await cursor.hasNext()){
    const doc = await cursor.next();
    scanned++;
    const combined = (doc.description_html || doc.description || '');
    const lower = combined.toLowerCase();
    // consider already present if 'origin' appears near 'turkey' or origin: exists
    if(lower.includes('origin') || lower.includes('origin:') || lower.includes('turkey')){
      skippedAlready++;
      continue;
    }
    found++;
    if(opts.apply){
      const newDesc = combined + '\n' + originHtml;
      await col.updateOne({ _id: doc._id }, { $set: { description_html: newDesc } });
      willUpdate++;
      if(sampleUpdated.length < 5) sampleUpdated.push({ product_id: doc.product_id, newHtml: originHtml });
    }
  }

  console.log(`[origin] scanned=${scanned} foundToUpdate=${found} applied=${willUpdate} skippedAlready=${skippedAlready} apply=${opts.apply}`);
  if(sampleUpdated.length) console.log('samples:', sampleUpdated);
  await client.close();
}

run().catch(err => { console.error(err); process.exit(1); });
