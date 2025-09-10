#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
const DB_NAME = process.env.MONGO_DB || undefined;
const NEW_TITLE = 'Cappadocia Rug';

async function run() {
  console.log('[set-titles] connecting to', MONGO_URI.startsWith('mongodb://') ? '[local]' : '[uri]');
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const coll = db.collection('products');

  console.log('[set-titles] running updateMany to set title ->', NEW_TITLE);
  const res = await coll.updateMany({}, { $set: { title: NEW_TITLE } });

  const report = {
    timestamp: new Date().toISOString(),
    mongoUri: MONGO_URI.startsWith('mongodb://') ? '[local]' : '[uri]',
    matchedCount: res.matchedCount ?? null,
    modifiedCount: res.modifiedCount ?? null,
  };

  try { fs.writeFileSync(path.join(process.cwd(),'tmp_set_titles_report.json'), JSON.stringify(report, null, 2)); } catch (e) {}

  console.log('[set-titles] done. matched=', report.matchedCount, 'modified=', report.modifiedCount);
  await mongoose.disconnect();
}

run().catch(e => { console.error('[set-titles] fatal', e && e.message ? e.message : e); process.exit(1); });
