import dotenv from 'dotenv';
import mongoose from 'mongoose';

// load .env.local if present
dotenv.config({ path: './.env.local' });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not found in environment (.env.local or env). Aborting.');
  process.exit(1);
}

async function run() {
  console.log('Connecting to MongoDB (read-only check)...');
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined, autoIndex: false });
  const db = mongoose.connection.db;
  const coll = db.collection('products');

  console.log('\nQuery: product_id ends with ".0"');
  // match literal ".0" suffix only
  const q1 = { product_id: { $regex: '\\.0$' } };
  const count1 = await coll.countDocuments(q1);
  console.log('Count:', count1);
  const docs1 = await coll.find(q1, { projection: { product_id: 1, title: 1, images: 1 } }).limit(50).toArray();
  docs1.forEach(d => {
    const alts = (d.images || []).slice(0,3).map(i => i.alt);
    console.log(d._id.toString(), 'product_id=', d.product_id, 'alts=', JSON.stringify(alts));
  });

  console.log('\nQuery: images[].alt ends with ".0"');
  // match literal ".0" suffix only in image alts
  const q2 = { 'images.alt': { $regex: '\\.0$' } };
  const count2 = await coll.countDocuments(q2);
  console.log('Count:', count2);
  const docs2 = await coll.find(q2, { projection: { product_id: 1, title: 1, images: 1 } }).limit(50).toArray();
  docs2.forEach(d => {
    const alts = (d.images || []).slice(0,6).map(i => i.alt);
    console.log(d._id.toString(), 'product_id=', d.product_id, 'alts=', JSON.stringify(alts));
  });

  await mongoose.disconnect();
  console.log('\nDone. (read-only)');
}

run().catch(err => {
  console.error('Error during DB check:', err);
  process.exit(2);
});
