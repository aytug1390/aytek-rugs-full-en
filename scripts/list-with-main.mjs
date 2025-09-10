import 'dotenv/config';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function run() {
  const docs = await Product.find({ main_image: { $exists: true, $ne: null, $ne: '' } }).limit(5).lean();
  console.log('found', docs.length, 'examples:');
  for (const d of docs) {
    console.log('product_id', d.product_id, 'main_image:', d.main_image, 'images_len:', (d.images||[]).length);
  }
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(2)});
