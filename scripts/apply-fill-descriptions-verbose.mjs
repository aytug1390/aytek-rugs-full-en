#!/usr/bin/env node
// scripts/apply-fill-descriptions-verbose.mjs
import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';

// load .env.local from project root
dotenv.config({ path: path.resolve(new URL(import.meta.url).pathname, '../../.env.local') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
console.log('[migrate-verbose] MONGO_URI=', MONGO_URI ? '[present]' : '[missing]');
if (!MONGO_URI) {
  console.error('[migrate-verbose] MONGO_URI missing; aborting');
  process.exit(1);
}

try {
  await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined });
  console.log('[migrate-verbose] connected to mongo');
} catch (e) {
  console.error('[migrate-verbose] mongo connect failed', e.message);
  process.exit(1);
}

const Product = (await import('../server/models/Product.js')).default;

function pickDescription(p) {
  if (p.description_html && String(p.description_html).trim()) return null;
  const candidates = [p.description_html, p.description, p.long_description, p.short_description, p.summary, p.title, p.name, p.product_id];
  for (const c of candidates) if (c && String(c).trim()) return String(c).trim();
  return '';
}

let scanned = 0, updated = 0;
const cursor = Product.find({ $or: [ { description_html: { $exists: false } }, { description_html: '' } ] }).cursor();
for await (const p of cursor) {
  scanned++;
  const pick = pickDescription(p);
  if (pick !== null && pick !== '') {
    try {
      await Product.updateOne({ _id: p._id }, { $set: { description_html: pick } });
      updated++;
      console.log('[migrate-verbose] updated', p.product_id || p._id);
    } catch (e) {
      console.error('[migrate-verbose] update failed', p._id, e.message);
    }
  }
}
console.log('[migrate-verbose] done scanned=', scanned, 'updated=', updated);
await mongoose.disconnect();
process.exit(0);
