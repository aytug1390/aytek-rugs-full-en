import 'dotenv/config';
import './server/db.js';
import Product from './server/models/Product.js';

(async()=>{
  try{
    const total = await Product.countDocuments();
    const hasImagesFieldTrue = await Product.countDocuments({ has_image: true });
    const hasImagesFieldFalse = await Product.countDocuments({ has_image: { $in: [false, null] } });
    const imagesUrlExists = await Product.countDocuments({'images.0.url': { $exists: true, $ne: '' }});
  // Avoid using $where (not allowed on some MongoDB tiers). Use $expr and $size instead.
  const imagesArrayGt0 = await Product.countDocuments({ $expr: { $gt: [ { $size: "$images" }, 0 ] } });
    const imageUrlFieldExists = await Product.countDocuments({ image_url: { $exists: true, $ne: '' } });
    const noImageList = await Product.find({ 'images.0.url': { $exists: false } }).select('product_id title has_image image_url').lean();
    console.log({ total, hasImagesFieldTrue, hasImagesFieldFalse, imagesUrlExists, imagesArrayGt0, imageUrlFieldExists, noImageCount: noImageList.length });
    console.log('sample no-image SKUs (first 20):', noImageList.slice(0,20).map(p=>({product_id:p.product_id,title:p.title,has_image:p.has_image,image_url:p.image_url})));
  }catch(e){ console.error(e); process.exit(2);} process.exit(0);
})();
