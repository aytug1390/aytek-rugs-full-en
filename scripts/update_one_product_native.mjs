#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
const productId = process.argv[2] || '16390';
const newDesc = process.argv[3] || `Updated description ${new Date().toISOString()}`;

async function main(){
  console.log('[native-update] connecting to', MONGO_URI.startsWith('mongodb://') ? '[local]' : MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, socketTimeoutMS: 45000 });
    console.log('[native-update] connected, readyState=', mongoose.connection.readyState);

    const db = mongoose.connection.db;
    const admin = db.admin();
    const ping = await admin.ping();
    console.log('[native-update] ping:', ping);

    const stats = await db.stats();
    console.log('[native-update] dbStats:', { db: stats.db, collections: stats.collections, objects: stats.objects });

    const collNames = await db.listCollections().toArray();
    console.log('[native-update] collections count=', collNames.length);

    const coll = db.collection('products');
    console.log('[native-update] finding product', productId);
    const before = await coll.findOne({ product_id: String(productId) });
    console.log('[native-update] before:', before ? { product_id: before.product_id, description_html: before.description_html } : null);

    const res = await coll.updateOne({ product_id: String(productId) }, { $set: { description_html: String(newDesc) } }, { upsert: false });
    console.log('[native-update] updateOne result:', res.result ? res.result : res);

    const after = await coll.findOne({ product_id: String(productId) });
    console.log('[native-update] after:', after ? { product_id: after.product_id, description_html: after.description_html } : null);

    await mongoose.disconnect();
    console.log('[native-update] done');
  } catch (err) {
    console.error('[native-update] failed', err && err.stack ? err.stack : err);
    try { await mongoose.disconnect(); } catch (e){}
    process.exit(1);
  }
}

main();
