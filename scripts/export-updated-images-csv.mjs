import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

function loadEnvUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  try {
    const p = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(p)) return null;
    const content = fs.readFileSync(p, 'utf8');
    const m = content.split(/\r?\n/).find(l => l.startsWith('MONGODB_URI='));
    if (!m) return null;
    return m.replace(/^MONGODB_URI=/, '').trim();
  } catch (e) { return null; }
}

const applyPath = path.resolve(process.cwd(), 'tmp', 'drive-url-apply-results.json');
if (!fs.existsSync(applyPath)){
  console.error('Apply results not found:', applyPath);
  process.exit(2);
}

const raw = fs.readFileSync(applyPath, 'utf8');
let parsed;
try{ parsed = JSON.parse(raw); } catch(e){ console.error('Invalid JSON in apply results:', e.message); process.exit(2); }
const results = parsed.results || parsed;
const updatedSkus = (results || []).filter(r => r && r.updated).map(r => String(r.sku));
if (!updatedSkus.length){
  console.log('No updated SKUs found in apply results.');
  process.exit(0);
}

const uri = loadEnvUri() || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aytek-rugs';
const client = new MongoClient(uri, { serverSelectionTimeoutMS:30000, connectTimeoutMS:20000, tls:true });

async function run(){
  await client.connect();
  const db = client.db();
  const coll = db.collection('products');

  const outPath = path.resolve(process.cwd(), 'tmp', 'drive-url-updated-images.csv');
  const outStream = fs.createWriteStream(outPath, { encoding: 'utf8' });
  outStream.write('sku,index,current_url\n');

  for (const sku of updatedSkus){
    const doc = await coll.findOne({ product_id: String(sku) }, { projection: { images: 1, product_id: 1 } });
    if (!doc) continue;
    const imgs = Array.isArray(doc.images) ? doc.images : [];
    for (let i=0;i<imgs.length;i++){
      const url = (imgs[i].url||'').replace(/\r?\n/g,' ').trim();
      outStream.write(`${sku},${i},"${url.replace(/"/g,'""')}"\n`);
    }
  }

  await new Promise(res => outStream.end(res));
  console.log('Wrote CSV to', outPath);
  await client.close();
}

run().catch(err=>{ console.error('Error:', err && err.stack ? err.stack : err); process.exit(2); });
