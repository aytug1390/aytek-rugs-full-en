#!/usr/bin/env node
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

const DEFAULT_CSV = path.resolve(process.cwd(), 'tmp', 'product_sizes_to_apply.csv');
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/aytekdb';

function parseArgs() {
  const out = { apply: false, file: DEFAULT_CSV, force: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--apply') out.apply = true;
    else if (a === '--force') out.force = true;
    else if (a.startsWith('--file=')) out.file = path.resolve(a.split('=')[1]);
  }
  return out;
}

async function readCsv(file) {
  const raw = await fs.readFile(file, 'utf8');
  const lines = raw.split(/\r?\n/).map(l => l.replace(/\u00A0/g,' ').trim());
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.includes('\t') ? line.split('\t') : line.split(',');
    const first = cols[0].trim();
    if (i === 0 && /[a-zA-Z]/.test(first)) continue;
    const sku = first;
    const size = cols.slice(1).join(' ').trim();
    out.push({ sku, size });
  }
  return out;
}

function toNumber(v) { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; }

function parseOneMeasurement(part) {
  if (!part) return null;
  // normalize common unicode primes/quotes
  let s = String(part).replace(/[\u2018\u2019\u2032]/g, "'").replace(/[\u201C\u201D\u2033]/g, '"').toLowerCase();
  s = s.replace(/''/g, '"').replace(/\s+/, ' ').trim();

  // direct cm / mm / m
  let m = s.match(/([0-9]+(?:[.,][0-9]+)?)\s*(cm)\b/);
  if (m) return { cm: toNumber(m[1]) };
  m = s.match(/([0-9]+(?:[.,][0-9]+)?)\s*(mm)\b/);
  if (m) return { cm: toNumber(m[1]) / 10 };
  m = s.match(/([0-9]+(?:[.,][0-9]+)?)\s*(m)\b/);
  if (m) return { cm: toNumber(m[1]) * 100 };

  // patterns like 6'4" or 6' 4" or 6 ft 4 in
  m = s.match(/^(?:approx\.?\s*)?(\d+)\s*(?:'|ft|feet)\s*(\d+)\s*(?:\"|in|inches)?$/);
  if (m) {
    const feet = parseInt(m[1], 10);
    const inches = parseInt(m[2], 10);
    const totalInches = feet * 12 + inches;
    return { cm: Math.round(totalInches * 2.54) };
  }

  // patterns like 6'4" (no space) or 6'4
  m = s.match(/^(\d+)\s*'\s*(\d+)(?:\"|\s*in)?$/);
  if (m) {
    const feet = parseInt(m[1], 10);
    const inches = parseInt(m[2], 10);
    return { cm: Math.round((feet * 12 + inches) * 2.54) };
  }

  // patterns like 6ft or 6' (feet only)
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:'|ft|feet)\b/);
  if (m) {
    const feet = toNumber(m[1]);
    if (feet !== null) return { cm: Math.round(feet * 30.48) };
  }

  // inches only
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:\"|in|inches)\b/);
  if (m) {
    const inches = toNumber(m[1]);
    if (inches !== null) return { cm: Math.round(inches * 2.54) };
  }

  // plain numbers: heuristic
  const numOnly = s.match(/^(\d+(?:[.,]\d+)?)$/);
  if (numOnly) {
    const n = toNumber(numOnly[1]);
    if (n === null) return null;
    // if the number looks large, assume cm (>30)
    if (n > 30) return { cm: Math.round(n) };
    // otherwise assume feet
    return { cm: Math.round(n * 30.48) };
  }

  // numbers separated by space like '6 4' (treat as feet inches)
  m = s.match(/^(\d+)\s+(\d+)$/);
  if (m) {
    const feet = parseInt(m[1], 10);
    const inches = parseInt(m[2], 10);
    return { cm: Math.round((feet * 12 + inches) * 2.54) };
  }

  // fallback: try to find first number and decide
  m = s.match(/(\d+(?:[.,]\d+)?)/);
  if (m) {
    const n = toNumber(m[1]);
    if (n != null) {
      if (n > 30) return { cm: Math.round(n) };
      return { cm: Math.round(n * 30.48) };
    }
  }

  return null;
}

function parseSizeToCm(sizeText) {
  if (!sizeText) return null;
  // separators x, ×, by
  const parts = sizeText.split(/\s*[x×by]\s*/i).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) {
    const one = parseOneMeasurement(parts[0]);
    if (!one) return null;
    // assign to width, height unknown
    return { width_cm: one.cm, height_cm: null };
  }
  // take first two as width x height
  const a = parseOneMeasurement(parts[0]);
  const b = parseOneMeasurement(parts[1]);
  if (!a && !b) return null;
  return { width_cm: a ? a.cm : null, height_cm: b ? b.cm : null };
}

function escapeHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function run() {
  const opts = parseArgs();
  const file = opts.file;
  if (!fsSync.existsSync(file)) {
    console.error('[err] CSV not found:', file);
    process.exit(1);
  }

  const rows = await readCsv(file);
  if (!rows.length) {
    console.error('[err] No rows parsed from CSV');
    process.exit(1);
  }

  console.log(`[sizes-num] parsed ${rows.length} rows from ${file}`);

  const client = new MongoClient(MONGO, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db();
  const col = db.collection('products');

  const preview = [];
  const toBackup = [];
  for (const r of rows) {
    const sku = String(r.sku).trim();
    if (!sku) continue;
    const parsed = parseSizeToCm(r.size || '');
    if (!parsed) {
      preview.push({ sku, parsed: null, note: 'parse_failed' });
      continue;
    }
    const variants = [sku, sku.replace(/^0+/, ''), String(parseInt(sku, 10))];
    const filter = { $or: variants.filter(Boolean).map(s => ({ product_id: s })) };
    const doc = await col.findOne(filter, { projection: { product_id:1, width_cm:1, height_cm:1 } });
    if (!doc) {
      preview.push({ sku, parsed, found: false });
      continue;
    }
    const willSet = {};
    if (parsed.width_cm != null) {
      if (doc.width_cm == null || opts.force) willSet.width_cm = parsed.width_cm;
    }
    if (parsed.height_cm != null) {
      if (doc.height_cm == null || opts.force) willSet.height_cm = parsed.height_cm;
    }
    preview.push({ sku, product_id: doc.product_id, parsed, found: true, existing: { width_cm: doc.width_cm, height_cm: doc.height_cm }, willSet });
    if (opts.apply && (willSet.width_cm !== undefined || willSet.height_cm !== undefined)) {
      toBackup.push({ _id: doc._id, product_id: doc.product_id, width_cm: doc.width_cm, height_cm: doc.height_cm });
    }
  }

  const scanned = preview.length;
  const found = preview.filter(p => p.found).length;
  const willUpdate = preview.filter(p => p.found && Object.keys(p.willSet || {}).length).length;
  console.log(`[sizes-num] scanned=${scanned} found=${found} willUpdate=${willUpdate} apply=${opts.apply} force=${opts.force}`);

  for (const p of preview.slice(0, 200)) {
    if (!p.parsed) console.log(`[MISS] ${p.sku} (parse failed)`);
    else if (!p.found) console.log(`[MISS] ${p.sku} (no product)`);
    else console.log(`[OK] ${p.sku} -> ${p.product_id} existing=${JSON.stringify(p.existing)} willSet=${JSON.stringify(p.willSet)}`);
  }

  if (opts.apply && toBackup.length) {
    const ts = Date.now();
    const bkPath = path.resolve('tmp', `size_fields_backup_${ts}.json`);
    await fs.writeFile(bkPath, JSON.stringify(toBackup, null, 2), 'utf8');
    console.log('[backup] written to', bkPath);
    // apply updates one by one
    for (const p of preview) {
      if (!p.found) continue;
      const set = p.willSet || {};
      if (!Object.keys(set).length) continue;
      await col.updateOne({ product_id: p.product_id }, { $set: set });
      console.log('[applied]', p.product_id, set);
    }
  }

  await client.close();
  console.log('done');
}

run().catch(err => { console.error(err); process.exit(1); });
