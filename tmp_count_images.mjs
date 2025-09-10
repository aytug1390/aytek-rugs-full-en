import 'dotenv/config';
import './server/db.js';
import Product from './server/models/Product.js';

(async()=>{
  try{
    const total = await Product.countDocuments();
    const withImages = await Product.countDocuments({'images.0.url': { $exists: true, $ne: '' }});
    const withoutImages = total - withImages;
    console.log('total:', total);
    console.log('withImages:', withImages);
    console.log('withoutImages:', withoutImages);

    // list a few sample product_ids without images
    const samples = await Product.find({ 'images.0.url': { $exists: false } }).limit(10).select('product_id title').lean();
    console.log('sample without images:', samples.map(s=> ({product_id: s.product_id, title: s.title} )));
  }catch(e){ console.error(e); process.exit(2);} process.exit(0);
})();
