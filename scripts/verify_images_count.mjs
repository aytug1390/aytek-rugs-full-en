import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import csvParse from 'csv-parse/lib/sync.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
const argv = process.argv.slice(2);
const CSV_ONLY = argv.includes('--csv-only') || argv.includes('--csvonly');

if (!CSV_ONLY && !MONGO_URI) {
  console.error('Missing MONGO_URI in environment. Set MONGO_URI and re-run, or use --csv-only to skip DB checks.');
  process.exit(1);
}

// Usage: node verify_images_count.mjs ./cappadocia.csv
const csvPath = process.argv[2] || path.join(process.cwd(), 'cappadocia.csv');
if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found at', csvPath);
  process.exit(1);
}

const csvRaw = fs.readFileSync(csvPath, 'utf8');
const records = csvParse(csvRaw, { columns: true, skip_empty_lines: true });

const totalRows = records.length;
const rowsWithImage = records.filter(r => (r.image_url && r.image_url.trim())).length;
const uniqueImages = new Set(records.filter(r => r.image_url && r.image_url.trim()).map(r => r.image_url.trim())).size;

async function main(){
  console.log('CSV:', csvPath);
  console.log('  totalRows:', totalRows);
  console.log('  rowsWithImage:', rowsWithImage);
  console.log('  uniqueImages:', uniqueImages);

  if (CSV_ONLY) {
    console.log('Running in --csv-only mode; skipping DB checks.');
    return;
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const products = db.collection('products');

  const dbCount = await products.countDocuments();
  const dbWithImagesCount = await products.countDocuments({ images: { $exists: true, $ne: [] } });

  console.log('DB:');
  console.log('  totalProducts (collection):', dbCount);
  console.log('  productsWithImages[]:', dbWithImagesCount);

  await client.close();
}

main().catch(e => { console.error(e); process.exit(2); });
