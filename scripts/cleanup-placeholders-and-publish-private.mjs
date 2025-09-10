import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import '../server/db.js';
import Product from '../server/models/Product.js';

const CSV_IN = path.join(process.cwd(), 'missing-skus-report.csv');
const BACKUP_OUT = path.join(process.cwd(), `placeholder-backup-${Date.now()}.json`);

async function readSkusFromCsv() {
  if (!fs.existsSync(CSV_IN)) return [];
  const raw = fs.readFileSync(CSV_IN, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  lines.shift();
  return lines.map(l => l.split(',')[0].trim()).filter(Boolean).map(s=>s.replace(/\.0$/, ''));
}

async function run(){
  const skus = await readSkusFromCsv();
  console.log('Placeholders from CSV:', skus.length);

  // Backup placeholder docs if exist
  const placeholders = await Product.find({ product_id: { $in: skus } }).lean();
  fs.writeFileSync(BACKUP_OUT, JSON.stringify({ backedUp: placeholders.length, items: placeholders }, null, 2));
  console.log('Backed up', placeholders.length, 'placeholder docs to', BACKUP_OUT);

  if (placeholders.length) {
    const ids = placeholders.map(p=>p._id);
    const res = await Product.deleteMany({ _id: { $in: ids } });
    console.log('Deleted placeholders count:', res.deletedCount || 0);
  } else {
    console.log('No placeholder docs to delete');
  }

  // Now publish products with visibility private (exclude those already deleted)
  const query = { visibility: 'private' };
  const update = { $set: { visibility: 'public', status: 'active' }, $addToSet: { collections: 'traditional' } };
  const res2 = await Product.updateMany(query, update);
  console.log('Updated products (made public):', res2.modifiedCount || res2.nModified || 0);

  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
