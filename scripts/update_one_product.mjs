#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
const productId = process.argv[2] || '16390';
const newDesc = process.argv[3] || `Updated description ${new Date().toISOString()}`;

(async ()=>{
  try {
    console.log('[update-one] connecting to', MONGO_URI.startsWith('mongodb://') ? '[local]' : MONGO_URI);
    await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, socketTimeoutMS: 45000, useNewUrlParser: true, useUnifiedTopology: true });
    console.log('[update-one] connected, readyState=', mongoose.connection.readyState);
    mongoose.connection.on('error', err => console.error('[update-one] mongoose error', err));
    mongoose.connection.on('disconnected', ()=> console.log('[update-one] mongoose disconnected'));
  } catch (e) {
    console.error('[update-one] mongo connect failed', e && e.stack ? e.stack : e);
    process.exit(1);
  }
  let Product;
  try { Product = (await import('../server/models/Product.js')).default; }
  catch (e) { console.error('[update-one] import Product failed', e && e.stack ? e.stack : e); await mongoose.disconnect(); process.exit(1); }

  try {
    console.log('[update-one] running update for product_id=', productId);
    const res = await Product.updateOne({ product_id: String(productId) }, { $set: { description_html: String(newDesc) } });
    console.log('[update-one] update result:', res);
    const p = await Product.findOne({ product_id: String(productId) }).lean();
    console.log('[update-one] after update:', { product_id: p && p.product_id, description_html: p && p.description_html });
  } catch (e) {
    console.error('[update-one] update failed', e && e.stack ? e.stack : e);
  } finally {
    await mongoose.disconnect();
  }
})();
