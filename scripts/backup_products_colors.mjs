import fs from 'fs';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aytekdb';
const client = new MongoClient(MONGO_URI, { ignoreUndefined: true });

async function run(){
  await client.connect();
  const db = client.db();
  const col = db.collection('products');

  const cursor = col.find({}, { projection: { product_id:1, color_code:1, color_hex:1, image_url:1, has_image:1 } });
  const out = [];
  while(await cursor.hasNext()){
    out.push(await cursor.next());
  }
  const path = 'tmp_products_colors_backup.json';
  fs.writeFileSync(path, JSON.stringify(out, null, 2), 'utf8');
  console.log('wrote', path, 'rows=', out.length);
  await client.close();
}

run().catch(err=>{ console.error(err); process.exit(2); });
