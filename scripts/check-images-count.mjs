import 'dotenv/config';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function run() {
  const withImages = await Product.countDocuments({ images: { $exists: true, $ne: [] } });
  const withMain = await Product.countDocuments({ main_image: { $exists: true, $ne: null, $ne: '' } });
  const total = await Product.countDocuments({});
  console.log('total products:', total);
  console.log('with images array:', withImages);
  console.log('with main_image:', withMain);
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(2)});
