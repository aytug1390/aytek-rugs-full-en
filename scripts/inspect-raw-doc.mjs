import 'dotenv/config';
import mongoose from '../server/db.js';

async function run(id='10000'){
  // wait for connection
  for (let i=0;i<50;i++) {
    if (mongoose.connection && mongoose.connection.db) break;
    await new Promise(r => setTimeout(r, 200));
  }
  const coll = mongoose.connection.db.collection('products');
  const doc = await coll.findOne({ product_id: String(id) });
  if (!doc) return console.log('not found', id);
  console.log('keys:', Object.keys(doc));
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
}

const id = process.argv[2] || '10000';
run(id).catch(e=>{console.error(e);process.exit(2)});
