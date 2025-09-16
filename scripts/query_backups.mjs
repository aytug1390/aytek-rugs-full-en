#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ silent: true });

function maskUri(uri) {
  if (!uri) return uri;
  try {
    // keep the scheme and host, mask credentials
    const replaced = uri.replace(/^(mongodb(?:\+srv)?:\/\/)(.*@)?(.+)$/, (m, scheme, creds, rest) => {
      if (!creds) return `${scheme}${rest}`;
      return `${scheme}****:****@${rest}`;
    });
    return replaced;
  } catch (e) {
    return uri.replace(/:(?=[^:/?#]*@)/, ':****');
  }
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = { productIds: [], limit: 5 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit' || a === '-n') {
      const v = argv[i + 1];
      out.limit = parseInt(v, 10) || out.limit;
      i++;
      continue;
    }
    if (a === '--help' || a === '-h') {
      out.help = true;
      continue;
    }
    out.productIds.push(a);
  }
  return out;
}

async function main() {
  const { productIds, limit, help } = parseArgs();
  if (help) {
    console.log('Usage: node ./scripts/query_backups.mjs [product_id ...] [--limit N]');
    console.log('If no product_id provided the script lists the most recent backups (by createdAt).');
    process.exit(0);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Missing environment variable MONGO_URI. Set $env:MONGO_URI in PowerShell before running.');
    process.exit(2);
  }

  const masked = maskUri(mongoUri);
  console.log(`MONGO_URI (masked): ${masked}`);

  // infer db name from URI path if present
  let dbName = 'aytekdb';
  try {
    const m = mongoUri.match(/\/([^/?]+)(\?|$)/);
    if (m && m[1]) dbName = m[1];
  } catch (e) {
    // ignore and use default
  }

  const client = new MongoClient(mongoUri);
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('products_migration_backups');

    let results = [];
    if (productIds.length > 0) {
      // fetch up to `limit` per product id
      for (const pid of productIds) {
        const docs = await col.find({ product_id: pid }).sort({ createdAt: -1 }).limit(limit).toArray();
        results.push({ product_id: pid, count: docs.length, docs });
      }
    } else {
      // list most recent backups across all products
      const docs = await col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
      results = docs.map(d => ({ product_id: d.product_id, createdAt: d.createdAt, _id: d._id }));
    }

    console.log(JSON.stringify({ queriedAt: new Date().toISOString(), db: dbName, results }, null, 2));
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Error while querying backups:', err && err.message ? err.message : err);
    try { await client.close(); } catch (e) {}
    process.exit(3);
  }
}

main();
