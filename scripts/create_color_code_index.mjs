import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aytekdb';
const client = new MongoClient(MONGO_URI, { ignoreUndefined: true });

async function run(){
  await client.connect();
  const db = client.db();
  const col = db.collection('products');
  const res = await col.createIndex({ color_code: 1 });
  console.log('created index:', res);
  await client.close();
}

run().catch(err=>{ console.error(err); process.exit(2); });
