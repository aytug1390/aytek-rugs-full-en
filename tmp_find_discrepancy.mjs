import 'dotenv/config';
import './server/db.js';
import Product from './server/models/Product.js';

(async()=>{
  try{
    const imagesUrlDocs = await Product.find({'images.0.url': {$exists:true, $ne:''}}).select('product_id title images').lean();
    const imagesLenDocs = await Product.find({ $expr: { $gt: [ { $size: "$images" }, 0 ] } }).select('product_id title images').lean();

    const urlSet = new Set(imagesUrlDocs.map(d=>d.product_id));
    const lenSet = new Set(imagesLenDocs.map(d=>d.product_id));

    const inLenNotUrl = imagesLenDocs.filter(d=>!urlSet.has(d.product_id));
    const inUrlNotLen = imagesUrlDocs.filter(d=>!lenSet.has(d.product_id));

    console.log('counts:', { imagesUrlDocs: imagesUrlDocs.length, imagesLenDocs: imagesLenDocs.length });
    console.log('inLenNotUrl count:', inLenNotUrl.length);
    console.log('inUrlNotLen count:', inUrlNotLen.length);
    if(inLenNotUrl.length) console.log('sample inLenNotUrl:', inLenNotUrl.slice(0,10).map(d=>({product_id:d.product_id,title:d.title,imagesCount:d.images?d.images.length:0})));
    if(inUrlNotLen.length) console.log('sample inUrlNotLen:', inUrlNotLen.slice(0,10).map(d=>({product_id:d.product_id,title:d.title,imagesCount:d.images?d.images.length:0})));
  }catch(e){ console.error(e); process.exit(2);} process.exit(0);
})();
