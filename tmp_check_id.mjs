import 'dotenv/config';
import './server/db.js';
import Product from './server/models/Product.js';

(async()=>{
  try{
    const id='68bfa486b8548c8ef1e73976';
    const byImgAlt = await Product.findOne({'images.alt': id}).lean();
    const byImgUrl = await Product.findOne({'images.url': { $regex: id }}).lean();
    console.log('byImgAlt:', !!byImgAlt, byImgAlt?{_id:byImgAlt._id,product_id:byImgAlt.product_id}:null);
    console.log('byImgUrl:', !!byImgUrl, byImgUrl?{_id:byImgUrl._id,product_id:byImgUrl.product_id}:null);
  }catch(e){ console.error(e); process.exit(2);} process.exit(0);
})();
