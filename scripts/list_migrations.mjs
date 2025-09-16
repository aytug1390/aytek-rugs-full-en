import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment. Set MONGO_URI and re-run.');
  process.exit(1);
}

async function main(){
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const backups = db.collection('products_migration_backups');

  const pipeline = [
    { $group: { _id: '$migrationId', count: { $sum: 1 }, firstApplied: { $min: '$appliedAt' }, lastApplied: { $max: '$appliedAt' } } },
    { $sort: { lastApplied: -1 } }
  ];

  const rows = await backups.aggregate(pipeline).toArray();
  if (!rows || rows.length === 0) {
    console.log('No migrations found in products_migration_backups');
    await client.close();
    return;
  }

  console.log('Found migrations:');
  for (const r of rows) {
    console.log(`- migrationId: ${r._id}  rows: ${r.count}  firstApplied: ${r.firstApplied}  lastApplied: ${r.lastApplied}`);
  }

  await client.close();
}

main().catch(e => { console.error(e); process.exit(2); });
