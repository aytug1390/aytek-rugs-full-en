#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { MongoClient } from 'mongodb';

// CLI args: <csv> [--apply] [--db DBNAME] [--limit N]
const argv = process.argv.slice(2);
if (argv.length === 0) { console.error('Usage: node scripts/import_cappadocia_csv.mjs <file.csv> [--apply] [--db DBNAME] [--limit N]'); process.exit(1); }
const CSV = argv[0];
const flags = new Set(argv.slice(1).filter(a=>a.startsWith('--')));
const getFlagVal = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i+1] && !argv[i+1].startsWith('--') ? argv[i+1] : null;
};
const DRY_RUN = !flags.has('--apply');
const TARGET_DB = getFlagVal('--db') || null;
const LIMIT = Number(getFlagVal('--limit') || 0) || 0;

const toDriveId = (u='') =>
  (u.match(/\/d\/([A-Za-z0-9_-]{10,})/)?.[1]) ||
  (u.match(/[?&]id=([A-Za-z0-9_-]{10,})/)?.[1]) || null;

const proxify = (u) => { const id = toDriveId(u); return id ? `/api/drive?id=${id}&w=1600` : null; };

const pickImages = (row) => {
  const cand = [];
  if (row.image_url) cand.push(row.image_url);
  if (row.image_link) cand.push(row.image_link);
  if (row.images) cand.push(...String(row.images).split(/[|,]/));
  for (let i=1;i<=10;i++) if (row[`image${i}`]) cand.push(row[`image${i}`]);
  return [...new Set(cand.map(s=>String(s).trim()).filter(Boolean).map(proxify).filter(Boolean))];
};

const csv = fs.readFileSync(CSV,'utf8');
const rows = parse(csv, { columns:true, skip_empty_lines:true });

const uri = process.env.MONGO_URI; if (!uri) { console.error('Missing MONGO_URI'); process.exit(1); }
const client = new MongoClient(uri); await client.connect();
const db = TARGET_DB ? client.db(TARGET_DB) : client.db();
const col = db.collection('products');
const backupsCol = db.collection('products_migration_backups');

// create a migration run id for grouping backups
const migrationId = `mig_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
console.log('migrationId=', migrationId);
if (DRY_RUN) console.log('Dry-run mode: no writes will be persisted. Use --apply to persist changes.');

let upserted=0, skipped=0;
for (const r of rows) {
  // determine SKU / product id and normalize
  const rawSku = r.sku || r.product_id || r.SKU || r.id;
  const sku = rawSku ? String(rawSku).trim() : null;
  if (!sku) { skipped++; continue; }

  const images = pickImages(r);

  // use the existing collection's unique key `product_id` when upserting
  const keyField = 'product_id';
  const query = { [keyField]: sku };

  const doc = {
    product_id: sku,
    name: r.name || r.title || r.product_title || 'Untitled',
    images,
    updatedAt: new Date(),
  };

  try {
    if (!DRY_RUN) {
      // write backup of current doc (if any)
  const existing = await col.findOne(query);
  await backupsCol.insertOne({ migrationId, product_id: sku, before: existing || null, csv: r, createdAt: new Date(), appliedAt: new Date() });

      const res = await col.updateOne(
        query,
        { $set: doc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      if (res.upsertedCount || res.modifiedCount) upserted++;
    } else {
      // dry-run: log what would be done
      console.log('[dry-run] would upsert', { query, doc });
      upserted++;
    }
  } catch (err) {
    // handle duplicate-key errors gracefully and continue with next row
    if (err && err.code === 11000) {
      console.error('Duplicate-key error for sku=', sku, ' — skipping row. Error:', err.message);
      skipped++;
      continue;
    }
    // rethrow unexpected errors
    throw err;
  }
}
await client.close();
console.log({ rows: rows.length, upserted, skipped });
