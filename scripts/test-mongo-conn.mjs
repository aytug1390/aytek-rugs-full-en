// Simple native MongoDB driver connection test with verbose output
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

function loadEnvUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  try {
    const root = fileURLToPath(new URL('..', import.meta.url));
    const envPath = `${root}/.env`;
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, 'utf8');
    const m = content.split(/\r?\n/).find(l => l.startsWith('MONGODB_URI='));
    if (!m) return null;
    return m.replace(/^MONGODB_URI=/, '').trim();
  } catch (err) {
    return null;
  }
}

const uri = loadEnvUri();
if (!uri) {
  console.error('No MONGODB_URI found in env or .env');
  process.exit(2);
}

console.log('Using MONGODB_URI=', uri.replace(/(mongodb\+srv:\/\/[^:]+:)[^@]+(@.*)/, '$1***$2'));

async function run() {
  // Increase timeouts to debug buffering/timeouts, enable TLS explicitly
  const opts = {
  // useUnifiedTopology is deprecated and removed in the current driver
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 60000,
    tls: true,
  };

  const client = new MongoClient(uri, opts);
  try {
    console.log('Connecting (this may take several seconds)...');
    await client.connect();
    console.log('Connected. Running a sample read from products collection...');
    const db = client.db();
    const coll = db.collection('products');
    const sample = await coll.findOne({});
    if (!sample) {
      console.log('No documents found in products collection (empty).');
    } else {
      console.log('Sample document _id=', sample._id?.toString ? sample._id.toString() : sample._id);
      // print a few keys to keep output small
      console.log('Sample keys:', Object.keys(sample).slice(0, 10));
    }
  } catch (err) {
    console.error('Connection error (full):', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}

run();
