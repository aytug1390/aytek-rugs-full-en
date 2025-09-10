import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';

dotenv.config({ path: './.env.local' });
const uri = process.env.MONGO_URI;
if(!uri){ console.error('MONGO_URI not found'); process.exit(1); }

const outDir = path.join(process.cwd(), 'tmp');
async function ensureOut(){
  try{ await fs.mkdir(outDir, { recursive: true }); }catch(e){}
}

async function run(){
  await ensureOut();
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined, autoIndex: false });
  const coll = mongoose.connection.db.collection('products');
  const q = { $or: [ { title: { $regex: 'Cappadocia', $options: 'i' } }, { description: { $regex: 'Cappadocia', $options: 'i' } } ] };
  const proj = { product_id:1, title:1, origin:1, size:1, size_text:1, color:1, images:1, description_html:1, updatedAt:1 };
  const docs = await coll.find(q, { projection: proj }).toArray();
  console.log('Found', docs.length, 'Cappadocia documents');

  const rows = docs.map(d=>({
    _id: d._id?.toString(),
    product_id: String(d.product_id || ''),
    title: d.title || '',
    origin: d.origin || '',
    size: d.size || d.size_text || '',
    color: Array.isArray(d.color) ? d.color.join(';') : (d.color || ''),
    image_alt: (d.images && d.images[0] && d.images[0].alt) || '',
    image_url: (d.images && d.images[0] && d.images[0].url) || '',
    description_html: d.description_html ? d.description_html.replace(/\r?\n/g,'') : ''
  }));

  const dbCsv = csvStringify(rows, { header: true });
  const dbOut = path.join(outDir, 'cappadocia_db_export.csv');
  await fs.writeFile(dbOut, dbCsv, 'utf8');
  console.log('Wrote', dbOut);

  // now check enhanced CSV if present
  const enhancedPath = path.join(process.cwd(), 'tmp_colors_by_sku.enhanced.csv');
  const matchOut = path.join(outDir, 'cappadocia_csv_matches.csv');
  let enhancedRows = [];
  try{
    const text = await fs.readFile(enhancedPath, 'utf8');
    enhancedRows = csvParse(text, { columns: true, skip_empty_lines: true });
  }catch(e){
    console.warn('No enhanced CSV found at', enhancedPath);
  }

  if(enhancedRows.length){
    const skuSet = new Set(rows.map(r=>r.product_id).filter(Boolean));
    const matches = enhancedRows.filter(r => skuSet.has((r.sku||'').toString()));
    const outCsv = csvStringify(matches, { header: true });
    await fs.writeFile(matchOut, outCsv, 'utf8');
    console.log('Wrote', matchOut, 'with', matches.length, 'rows');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err=>{ console.error('Error:', err); process.exit(2); });
