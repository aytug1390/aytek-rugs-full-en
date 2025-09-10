import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';

dotenv.config({ path: './.env.local' });
const uri = process.env.MONGO_URI;
if(!uri){ console.error('MONGO_URI not found'); process.exit(1); }

async function normalizeAlt(a){
  if(typeof a !== 'string') return a;
  return a.replace(/\.0$/, '');
}

async function run(){
  const enhancedPath = path.join(process.cwd(), 'tmp_colors_by_sku.enhanced.csv');
  let enhancedRows = [];
  try{
    const txt = await fs.readFile(enhancedPath, 'utf8');
    enhancedRows = csvParse(txt, { columns: true, skip_empty_lines: true });
  }catch(e){
    console.error('enhanced CSV not found:', enhancedPath);
    process.exit(1);
  }
  console.log('Enhanced rows:', enhancedRows.length);

  // build map sku -> data
  const map = new Map();
  for(const r of enhancedRows){
    const sku = (r.sku||'').toString().trim();
    if(!sku) continue;
    map.set(sku, r);
  }
  if(map.size===0){ console.error('No sku rows found'); process.exit(1); }

  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined, autoIndex: false });
  const coll = mongoose.connection.db.collection('products');

  // fetch matching docs
  const skus = Array.from(map.keys());
  const q = { product_id: { $in: skus } };
  console.log('Querying DB for', skus.length, 'skus...');
  const docs = await coll.find(q).toArray();
  console.log('Found', docs.length, 'existing documents to update');

  // backup
  const outDir = path.join(process.cwd(),'tmp');
  await fs.mkdir(outDir, { recursive: true });
  const backupPath = path.join(outDir, 'pre_update_backup_products.json');
  await fs.writeFile(backupPath, JSON.stringify(docs,null,2),'utf8');
  console.log('Wrote backup to', backupPath);

  // prepare bulk ops
  const ops = [];
  for(const doc of docs){
    const pid = String(doc.product_id || '');
    const row = map.get(pid);
    if(!row) continue;
    // normalize color to array
    const colorField = (row.color||'').toString().trim();
    const colors = colorField ? colorField.split(';').map(s=>s.trim()).filter(Boolean) : [];
    const origin = (row.origin||'').toString().trim() || (doc.origin||'');
    const size = (row.size||'').toString().trim() || (doc.size || doc.size_text || '');

    // normalize images alt
    const newImages = (doc.images || []).map(img => ({
      ...img,
      alt: img.alt ? img.alt.toString().replace(/\.0$/, '') : img.alt
    }));

    const setDoc = {
      origin: origin || undefined,
      size: size || undefined,
      size_text: size || undefined,
      color: colors.length ? colors : undefined,
      // keep existing title/description
      images: newImages
    };
    // remove undefined fields to avoid clearing
    Object.keys(setDoc).forEach(k=> setDoc[k]===undefined && delete setDoc[k]);

    if(Object.keys(setDoc).length===0) continue;

    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: setDoc } } });
  }

  console.log('Prepared', ops.length, 'bulk operations');
  if(ops.length===0){ console.log('Nothing to update'); await mongoose.disconnect(); return; }

  // execute bulkWrite
  const res = await coll.bulkWrite(ops, { ordered: false });
  console.log('BulkWrite result:', JSON.stringify({ matchedCount: res.matchedCount, modifiedCount: res.modifiedCount, upsertedCount: res.upsertedCount }));

  await mongoose.disconnect();
  console.log('Done updates.');
}

run().catch(err=>{ console.error('Error:', err); process.exit(2); });
