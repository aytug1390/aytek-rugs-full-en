#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
(async function main(){
  try {
    await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  } catch (e) {
    console.error('[check-db] mongo connect failed', e && e.message ? e.message : e);
    process.exit(1);
  }

  const pid = process.argv[2] || '16390';
  try {
    const db = mongoose.connection.db;
    const coll = db.collection('products');
    const p = await coll.findOne({ product_id: String(pid) });
    if (!p) {
      console.log(JSON.stringify({ found: false, product_id: pid }, null, 2));
    } else {
      console.log(JSON.stringify({ product_id: p.product_id, description_html: p.description_html || null }, null, 2));
    }
  } catch (e) {
    console.error('[check-db] query failed', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
