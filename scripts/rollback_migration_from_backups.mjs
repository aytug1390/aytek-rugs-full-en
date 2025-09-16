#!/usr/bin/env node
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment. Set MONGO_URI and re-run.');
  process.exit(1);
}

// Usage:
// node rollback_migration_from_backups.mjs --migrationId MIG_ID
// or
// node rollback_migration_from_backups.mjs 10002 10003 ... (product ids)
const argv = process.argv.slice(2);
const getFlagVal = (name) => { const i = argv.indexOf(name); return i >= 0 && argv[i+1] && !argv[i+1].startsWith('--') ? argv[i+1] : null; };
const MIGRATION_ID = getFlagVal('--migrationId');
const productIds = argv.filter(a => !a.startsWith('--'));

async function main(){
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const products = db.collection('products');
  const backups = db.collection('products_migration_backups');

  const report = { rolledBack: [], missingBackups: [] };

  if (MIGRATION_ID) {
    // restore all backups for migration
    const cursor = backups.find({ migrationId: MIGRATION_ID }).sort({ appliedAt: -1 });
    while (await cursor.hasNext()) {
      const b = await cursor.next();
      const pid = b.product_id;
      const before = b.before;
      if (!pid) continue;
      if (before === null) {
        await products.deleteOne({ product_id: pid });
        report.rolledBack.push({ product_id: pid, restored: 'deleted' });
      } else {
        await products.replaceOne({ product_id: pid }, before, { upsert: true });
        report.rolledBack.push({ product_id: pid, restoredDocId: before._id });
      }
    }
  } else if (productIds.length) {
    for (const pid of productIds){
      // find latest backup for product_id by appliedAt descending
      const b = await backups.find({ product_id: pid }).sort({ appliedAt: -1 }).limit(1).toArray();
      if (!b || b.length === 0){
        report.missingBackups.push(pid);
        continue;
      }
      const backup = b[0];
      if (!backup.before) {
        report.missingBackups.push(pid);
        continue;
      }
      const beforeDoc = backup.before;
      await products.replaceOne({ product_id: pid }, beforeDoc, { upsert: true });
      report.rolledBack.push({ product_id: pid, restoredDocId: beforeDoc._id });
    }
  } else {
    console.error('Provide --migrationId <id> or at least one product_id to rollback.');
    process.exit(1);
  }

  console.log(JSON.stringify(report, null, 2));
  await client.close();
}

main().catch(e => { console.error(e); process.exit(2); });
