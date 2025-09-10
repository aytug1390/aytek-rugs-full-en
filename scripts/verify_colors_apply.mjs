import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aytekdb';
const client = new MongoClient(MONGO_URI, { ignoreUndefined: true });

async function run(){
  await client.connect();
  const db = client.db();
  const col = db.collection('products');

  const total = await col.countDocuments();
  const withColorCode = await col.countDocuments({ color_code: { $exists: true, $ne: [] } });
  const withColorHex = await col.countDocuments({ color_hex: { $exists: true, $ne: [] } });
  const withImage = await col.countDocuments({ has_image: true });

  console.log('total_documents:', total);
  console.log('with color_code:', withColorCode);
  console.log('with color_hex:', withColorHex);
  console.log('with has_image true:', withImage);

  const samples = await col.find({}, { projection: { product_id:1, color_code:1, color_hex:1, image_url:1, has_image:1 } }).limit(5).toArray();
  console.log('\nsample documents:');
  console.log(JSON.stringify(samples, null, 2));

  await client.close();
}

run().catch(err=>{ console.error(err); process.exit(2); });
