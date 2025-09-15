#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';
import fs from 'node:fs';

// Inline migration that writes a JSON report of updates
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
console.log('[report-migrate] using MONGO_URI=', MONGO_URI.startsWith('mongodb://') ? '[local]' : '[uri]');

async function main(){
  await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  console.log('[report-migrate] connected');

  const db = mongoose.connection.db;
  const coll = db.collection('products');

  function pickDescription(p) {
    if (p.description_html && String(p.description_html).trim()) return null;
    const candidates = [p.description_html, p.description, p.long_description, p.short_description, p.summary, p.title, p.name, p.product_id];
    for (const c of candidates) if (c && String(c).trim()) return String(c).trim();
    return '';
  }

  const report = { scanned:0, updated:0, updates: [], errors: [] };
  try {
    const cursor = coll.find({ $or: [ { description_html: { $exists: false } }, { description_html: '' } ] });
    for await (const p of cursor) {
      try {
        report.scanned++;
        const pick = pickDescription(p);
        if (pick !== null && pick !== '') {
          console.log('[report-migrate] updating', p.product_id, '->', pick);
          const res = await coll.updateOne({ _id: p._id }, { $set: { description_html: pick } });
          const modified = res.modifiedCount || 0;
          report.updated += modified;
          report.updates.push({ product_id: p.product_id, _id: String(p._id), new: pick, matched: res.matchedCount || 0, modified });
          console.log('[report-migrate] updated', p.product_id, 'modified=', modified);
        }
      } catch (innerErr) {
        console.error('[report-migrate] failed for', p && p.product_id, innerErr && innerErr.message ? innerErr.message : innerErr);
        report.errors.push({ _id: String(p && p._id), product_id: p && p.product_id, error: String(innerErr && innerErr.message ? innerErr.message : innerErr) });
      }
    }
  } catch (scanErr) {
    console.error('[report-migrate] scan failed', scanErr && scanErr.message ? scanErr.message : scanErr);
    report.errors.push({ stage: 'scan', error: String(scanErr && scanErr.message ? scanErr.message : scanErr) });
  } finally {
    try {
      fs.writeFileSync('tmp_migrate_report.json', JSON.stringify(report, null, 2));
      console.log('[report-migrate] wrote tmp_migrate_report.json');
    } catch (fsErr) {
      console.error('[report-migrate] failed to write report', fsErr && fsErr.message ? fsErr.message : fsErr);
    }
    await mongoose.disconnect();
  }
}

main().catch(e=>{ console.error('migration failed', e); process.exit(1); });
