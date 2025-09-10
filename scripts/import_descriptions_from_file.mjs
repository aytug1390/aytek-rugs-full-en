#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
// load .env / .env.local if present so MONGO_URI is available when running the script
try {
   
  import('dotenv').then(d => d.config());
} catch (e) {
  // ignore if dotenv isn't available; script will fall back to environment variables
}

function usage() {
  console.log('import_descriptions_from_file.mjs <file> [--id-field=product_id] [--desc-field=description_html] [--limit=N] [--apply]');
  console.log('Supports CSV (header row) or JSON (array of objects). By default runs in preview mode; add --apply to write.');
}

const argv = process.argv.slice(2);
if (!argv[0]) { usage(); process.exit(1); }

const filePath = argv[0];
const opts = Object.fromEntries(argv.slice(1).map(a => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  if (!m) return [a, true];
  return [m[1], m[2] === undefined ? true : m[2]];
}));

const idField = opts['id-field'] || 'product_id';
const descField = opts['desc-field'] || 'description_html';
const limit = opts.limit ? Number(opts.limit) : Infinity;
const doApply = !!opts.apply;

function readFileSyncUtf(file) { return fs.readFileSync(file, { encoding: 'utf8' }); }

if (!fs.existsSync(filePath)) {
  console.error('[import] file not found:', filePath);
  process.exit(2);
}

let rows = [];
const ext = path.extname(filePath).toLowerCase();
const raw = readFileSyncUtf(filePath);
try {
  if (ext === '.json') {
    const j = JSON.parse(raw);
    if (Array.isArray(j)) rows = j;
    else if (j && j.items && Array.isArray(j.items)) rows = j.items;
    else {
      console.error('[import] JSON file did not contain an array at top-level');
      process.exit(3);
    }
  } else {
    // assume CSV
    rows = parse(raw, { columns: true, skip_empty_lines: true });
  }
} catch (e) {
  console.error('[import] parse error', e && e.message ? e.message : e);
  process.exit(4);
}

const proposals = [];
for (const r of rows) {
  if (proposals.length >= limit) break;
  const idv = r[idField] !== undefined ? r[idField] : (r.product_id ?? r.id ?? r.sku);
  if (idv === undefined || idv === null || String(idv).trim() === '') continue;
  const desc = (r[descField] ?? r.description ?? r.desc ?? '').toString().trim();
  if (!desc) continue;
  proposals.push({ id: idv, description: desc });
}

console.log('[import] source=', filePath, 'rows=', rows.length, 'proposals=', proposals.length, 'previewLimit=', Math.min(limit, proposals.length));
if (proposals.length === 0) process.exit(0);

console.log('\nFirst proposals (up to 10):');
proposals.slice(0,10).forEach((p,i)=>{
  console.log(i+1, 'id=', p.id, 'len=', p.description.length, 'snippet=', p.description.slice(0,120).replace(/\n/g,' '));
});

if (!doApply) {
  console.log('\nPreview mode (no DB writes). To apply, re-run with --apply');
  process.exit(0);
}

// Apply updates using native collection via mongoose connection
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
console.log('[import] applying updates to DB via MONGO_URI=', MONGO_URI.startsWith('mongodb://') ? '[local]' : '[uri]');

async function run() {
  await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, socketTimeoutMS: 45000 });
  const db = mongoose.connection.db;
  const coll = db.collection('products');
  const report = { source: filePath, scanned: rows.length, proposals: proposals.length, attempted: 0, updated: 0, errors: [] };

  for (const p of proposals) {
    report.attempted++;
    const idRaw = p.id;
    const idNum = Number(idRaw);
    const filter = { $or: [ { product_id: idNum }, { product_id: String(idRaw) }, { sku: String(idRaw) } ] };
    try {
      const res = await coll.updateOne(filter, { $set: { description_html: p.description } });
      if (res.matchedCount === 0 && res.modifiedCount === 0) {
        // try matching by _id if looks like an ObjectId string
        // skip complex _id handling here; record as not found
        report.errors.push({ id: p.id, error: 'no-match' });
      } else {
        report.updated += (res.modifiedCount || 0);
      }
    } catch (e) {
      report.errors.push({ id: p.id, error: e && e.message ? e.message : String(e) });
    }
  }

  // write report
  try { fs.writeFileSync(path.join(process.cwd(),'tmp_import_report.json'), JSON.stringify(report, null, 2)); } catch (e) {}
  console.log('[import] done. attempted=', report.attempted, 'updated=', report.updated, 'errors=', report.errors.length);
  await mongoose.disconnect();
}

run().catch(e=>{ console.error('[import] fatal', e && e.stack ? e.stack : e); process.exit(1); });
