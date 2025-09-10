#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import sharp from 'sharp';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
const DB_NAME = process.env.MONGO_DB || undefined;

function quantizeColor(r,g,b){
  // Reduce to 5 bits per channel and pack into integer
  const rq = r >> 3;
  const gq = g >> 3;
  const bq = b >> 3;
  return (rq<<10) | (gq<<5) | bq;
}

function unpackColor(key){
  const rq = (key >> 10) & 0x1F;
  const gq = (key >> 5) & 0x1F;
  const bq = key & 0x1F;
  // expand back to 0-255 (center of bucket)
  const r = Math.round((rq * 255) / 31);
  const g = Math.round((gq * 255) / 31);
  const b = Math.round((bq * 255) / 31);
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

async function fetchBuffer(url){
  try{
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'node-fetch' } });
    if(!res.ok) throw new Error('http:'+res.status);
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  }catch(e){
    throw e;
  }
}

async function analyzeImageBuffer(buf){
  // resize to manageable size then get raw pixels
  const img = sharp(buf).removeAlpha();
  const resized = img.resize(60,60, { fit: 'inside' }).raw();
  const { data, info } = await resized.toBuffer({ resolveWithObject: true });
  const counts = new Map();
  const channels = info.channels || 3;
  for(let i=0;i<data.length;i+=channels){
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const key = quantizeColor(r,g,b);
    counts.set(key, (counts.get(key)||0)+1);
  }
  // pick top 3
  const entries = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>unpackColor(e[0]));
  return entries;
}

async function run(){
  console.log('[colors] connecting to', MONGO_URI.startsWith('mongodb://') ? '[local]' : '[uri]');
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const coll = db.collection('products');

  const cursor = coll.find({}, { projection: { product_id:1, images:1, main_image:1 } });
  const report = {};
  let processed = 0;
  for await (const doc of cursor){
    const idRaw = String(doc.product_id ?? doc._id ?? '');
    const sku = idRaw.replace(/\.0$/, '');
    // determine primary url
    let url = null;
    if (Array.isArray(doc.images) && doc.images.length>0) url = doc.images[0].url || doc.images[0];
    if (!url && doc.main_image) url = doc.main_image;
    if (!url) { report[sku] = { error: 'no-image' }; continue; }
    // skip numeric-only values
    if (/^[0-9]+(?:\.0)?$/.test(String(url).trim())) { report[sku] = { error: 'numeric-image-src' }; continue; }

    try{
      const buf = await fetchBuffer(url);
      const cols = await analyzeImageBuffer(buf);
      report[sku] = { colors: cols, image: url };
    }catch(e){
      report[sku] = { error: e && e.message ? e.message : String(e), image: url };
    }
    processed++;
    if (processed % 50 === 0) console.log('[colors] processed', processed);
  }

  const outPath = path.join(process.cwd(),'tmp_colors_by_sku.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log('[colors] done. processed=', processed, 'wrote=', outPath);
  await mongoose.disconnect();
}

run().catch(e=>{ console.error('[colors] fatal', e && e.stack ? e.stack : e); process.exit(1); });
