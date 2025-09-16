#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';
import fs from 'node:fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';

async function main(){
  console.log('[dump-missing] connecting to', MONGO_URI.startsWith('mongodb://') ? '[local]' : MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    const coll = db.collection('products');
    const filter = { $or: [ { description_html: { $exists: false } }, { description_html: '' } ] };
    const cursor = coll.find(filter);

    const out = [];
    for await (const doc of cursor) {
      out.push({ _id: String(doc._id), product_id: doc.product_id, title: doc.title, description: doc.description, description_html: doc.description_html, short_description: doc.short_description });
    }

    fs.writeFileSync('tmp_missing_products.json', JSON.stringify({ exported: out.length, exported_at: new Date().toISOString(), rows: out }, null, 2));
    console.log('[dump-missing] wrote tmp_missing_products.json, count=', out.length);
    await mongoose.disconnect();
  } catch (err) {
    console.error('[dump-missing] failed', err && err.stack ? err.stack : err);
    try { await mongoose.disconnect(); } catch(e){}
    process.exit(1);
  }
}

main();
