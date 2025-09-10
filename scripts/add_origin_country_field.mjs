#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/aytekdb';

function parseArgs(){
  const out = { apply: false, force: false };
  for(const a of process.argv.slice(2)){
    if(a === '--apply') out.apply = true;
    if(a === '--force') out.force = true;
  }
  return out;
}

async function run(){
  const opts = parseArgs();
  const client = new MongoClient(MONGO, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db();
  const col = db.collection('products');

  // find docs missing origin_country or with null/empty
  const filterMissing = { $or: [ { origin_country: { $exists: false } }, { origin_country: null }, { origin_country: "" } ] };
  const toUpdateCount = await col.countDocuments(filterMissing);

  console.log(`[origin-field] toUpdate=${toUpdateCount} apply=${opts.apply}`);
  if(!toUpdateCount){
    await client.close();
    return;
  }

  if(!opts.apply){
    console.log('[origin-field] dry-run complete. Rerun with --apply to write changes.');
    await client.close();
    return;
  }

  // backup list of affected documents (product_id and existing origin_country)
  const cursor = col.find(filterMissing, { projection: { product_id:1, origin_country:1 } });
  const backup = [];
  while(await cursor.hasNext()){
    const d = await cursor.next();
    backup.push({ product_id: d.product_id, origin_country: d.origin_country ?? null });
  }
  const outPath = path.resolve(process.cwd(), 'tmp', `origin_country_backup_${Date.now()}.json`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(backup, null, 2), 'utf8');
  console.log('[origin-field] backup written to', outPath);

  // perform bulk update
  const res = await col.updateMany(filterMissing, { $set: { origin_country: 'Turkey' } });
  console.log('[origin-field] matchedCount=', res.matchedCount, 'modifiedCount=', res.modifiedCount);

  await client.close();
}

run().catch(err => { console.error(err); process.exit(1); });
