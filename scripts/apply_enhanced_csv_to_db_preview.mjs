import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';

dotenv.config({ path: './.env.local' });
const uri = process.env.MONGO_URI;
if(!uri){ console.error('MONGO_URI not found'); process.exit(1); }

async function run(){
  const enhancedPath = path.join(process.cwd(), 'tmp_colors_by_sku.enhanced.csv');
  const txt = await fs.readFile(enhancedPath, 'utf8');
  const enhancedRows = csvParse(txt, { columns: true, skip_empty_lines: true });
  const map = new Map();
  for(const r of enhancedRows){ const sku = (r.sku||'').toString().trim(); if(sku) map.set(sku,r); }

  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined, autoIndex: false });
  const coll = mongoose.connection.db.collection('products');
  const skus = Array.from(map.keys());
  const docs = await coll.find({ product_id: { $in: skus } }).toArray();

  const opsPreview = [];
  for(const doc of docs){
    const pid = String(doc.product_id || '');
    const row = map.get(pid);
    if(!row) continue;
    const colorField = (row.color||'').toString().trim();
    const colors = colorField ? colorField.split(';').map(s=>s.trim()).filter(Boolean) : [];
    const origin = (row.origin||'').toString().trim() || (doc.origin||'');
    const size = (row.size||'').toString().trim() || (doc.size || doc.size_text || '');
    const newImages = (doc.images || []).map(img => ({ ...img, alt: img.alt ? img.alt.toString().replace(/\.0$/,'') : img.alt }));
    const setDoc = { origin: origin||undefined, size: size||undefined, size_text: size||undefined, color: colors.length?colors:undefined, images: newImages };
    Object.keys(setDoc).forEach(k=> setDoc[k]===undefined && delete setDoc[k]);
    if(Object.keys(setDoc).length===0) continue;
    opsPreview.push({ _id: doc._id.toString(), product_id: pid, set: setDoc });
  }

  const outDir = path.join(process.cwd(),'tmp'); await fs.mkdir(outDir,{recursive:true});
  const previewPath = path.join(outDir,'cappadocia_update_ops_preview.json');
  await fs.writeFile(previewPath, JSON.stringify(opsPreview,null,2),'utf8');
  console.log('Wrote preview to', previewPath, ' with', opsPreview.length, 'ops');

  await mongoose.disconnect();
}

run().catch(err=>{ console.error(err); process.exit(2); });
