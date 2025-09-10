import 'dotenv/config';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function run(){
  console.log('Listing products without images...');
  const docs = await Product.find({ $or: [ { images: { $exists: false } }, { 'images.0': { $exists: false } }, { images: { $size: 0 } } ] }).select('product_id title').lean();
  console.log('count:', docs.length);
  for(const d of docs) console.log(d.product_id);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
