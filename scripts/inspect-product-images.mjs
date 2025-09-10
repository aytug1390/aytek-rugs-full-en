import 'dotenv/config';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function run() {
  const argId = process.argv[2];
  let p;
  if (argId) {
    p = await Product.findOne({ product_id: String(argId) }).lean();
    if (!p) return console.log('Not found', argId);
  } else {
    p = await Product.findOne({ images: { $exists: true, $ne: [] } }).lean();
    if (!p) return console.log('No product with images found');
  }
  console.log('product_id:', p.product_id);
  console.log('main_image:', p.main_image);
  console.log('images sample (first 10):', (p.images || []).slice(0,10));
}

run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(2)});
