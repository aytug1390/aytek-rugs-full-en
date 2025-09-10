#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';

async function main(){
  console.log('[count-missing] connecting to', MONGO_URI.startsWith('mongodb://') ? '[local]' : MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    const coll = db.collection('products');
    const filter = { $or: [ { description_html: { $exists: false } }, { description_html: '' } ] };
    const count = await coll.countDocuments(filter);
    console.log('[count-missing] count=', count);
    const samples = await coll.find(filter, { projection: { product_id: 1 } }).limit(10).toArray();
    console.log('[count-missing] sample product_ids=', samples.map(s=>s.product_id));
    await mongoose.disconnect();
  } catch (err) {
    console.error('[count-missing] failed', err && err.stack ? err.stack : err);
    try { await mongoose.disconnect(); } catch(e){}
    process.exit(1);
  }
}

main();
