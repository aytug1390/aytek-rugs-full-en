#!/usr/bin/env node
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const DEFAULT_CSV = path.resolve(process.cwd(), 'tmp', 'product_sizes_to_apply.csv');
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/aytekdb';

function parseArgs() {
  const out = { apply: false, file: DEFAULT_CSV };
  for (const a of process.argv.slice(2)) {
    if (a === '--apply') out.apply = true;
    else if (a.startsWith('--file=')) out.file = path.resolve(a.split('=')[1]);
  }
  return out;
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function readCsv(file) {
  const raw = await fs.readFile(file, 'utf8');
  const lines = raw.split(/\r?\n/).map(l => l.replace(/\u00A0/g,' ').trim());
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    // detect delimiter: tab or comma
    const cols = line.includes('\t') ? line.split('\t') : line.split(',');
    const first = cols[0].trim();
    // skip header if first row contains letters like 'sku' or 'product'
    if (i === 0 && /[a-zA-Z]/.test(first)) continue;
    const sku = first;
    const size = cols.slice(1).join(' ').trim();
    out.push({ sku, size });
  }
  return out;
}

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

  console.log(`[sizes] parsed ${rows.length} rows from ${file}`);

  const client = new MongoClient(MONGO, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db();
  const col = db.collection('products');

  const preview = [];
  for (const r of rows) {
    const sku = String(r.sku).trim();
    if (!sku) continue;
    const sizeText = r.size;
    const html = `<div class="mt-4 text-sm text-gray-700"><strong>Size:</strong> ${escapeHtml(sizeText)}</div>`;
    const variants = [sku, sku.replace(/^0+/, ''), String(parseInt(sku, 10))];
    const filter = { $or: variants.filter(Boolean).map(s => ({ product_id: s })) };
    const doc = await col.findOne(filter, { projection: { product_id: 1, description_html: 1, description:1 } });
    if (!doc) {
      preview.push({ sku, found: false, html });
      continue;
    }
    const existing = doc.description_html || doc.description || '';
    const already = existing && existing.includes(sizeText);
    preview.push({ sku, found: true, product_id: doc.product_id, already, html });
    if (opts.apply && !already) {
      const newDesc = (doc.description_html || doc.description || '') + '\n' + html;
      await col.updateOne({ _id: doc._id }, { $set: { description_html: newDesc } });
    }
  }

  const scanned = preview.length;
  const found = preview.filter(p => p.found).length;
  const willUpdate = preview.filter(p => p.found && !p.already).length;
  console.log(`[sizes] scanned=${scanned} found=${found} willUpdate=${willUpdate} apply=${opts.apply}`);
  for (const p of preview.slice(0, 200)) {
    console.log(p.found ? `[OK] ${p.sku} -> ${p.product_id} ${p.already ? '(already)' : ''}` : `[MISS] ${p.sku}`);
    if (p.found) console.log('   html:', p.html);
  }

  await client.close();
  console.log('done');
}

run().catch(err => { console.error(err); process.exit(1); });
