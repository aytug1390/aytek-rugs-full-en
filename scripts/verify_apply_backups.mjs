#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment. Set MONGO_URI and re-run.');
  process.exit(1);
}

const productIds = ['10002','10003','10004','10005','10006','10007','10010'];

async function main(){
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const backups = db.collection('products_migration_backups');

  const results = {};
  for (const pid of productIds){
    const count = await backups.countDocuments({ product_id: pid });
    const sample = await backups.findOne({ product_id: pid });
    results[pid] = { backups_count: count, sample_exists: !!sample };
  }

  console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), results }, null, 2));

  await client.close();
}

main().catch(e => { console.error(e); process.exit(2); });
