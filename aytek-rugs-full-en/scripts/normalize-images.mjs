import 'dotenv/config';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function normalize(){
  console.log('[norm] connecting to DB');
  const cursor = Product.find({}).cursor();
  let total=0, modified=0;
  for await (const doc of cursor){
    total++;
    let changed = false;
    // case A: images is not an array -> convert or remove
    if (!Array.isArray(doc.images)){
      if (doc.images && typeof doc.images === 'string'){
        doc.images = [{ url: doc.images, alt: '', isPrimary: true }];
        changed = true;
      } else {
        doc.images = [];
        changed = true;
      }
    }
    // case B: images array items may be strings (legacy) -> convert to objects
    for (let i=0;i<doc.images.length;i++){
      const it = doc.images[i];
      if (typeof it === 'string'){
        doc.images[i] = { url: it, alt: '', isPrimary: false };
        changed = true;
      } else if (!it || !it.url){
        // remove invalid entries
        doc.images.splice(i,1); i--; changed = true;
      }
    }
    // case C: if main_image exists and images empty, seed it
    if ((!doc.images || doc.images.length === 0) && doc.main_image){
      doc.images = [{ url: doc.main_image, alt: '', isPrimary: true }];
      changed = true;
    }
    // ensure isPrimary on first
    if (doc.images && doc.images.length){
      if (!doc.images.some(i=>i.isPrimary)){
        doc.images[0].isPrimary = true; changed = true;
      }
    }
    if (changed){
      try{
        await Product.updateOne({ _id: doc._id }, { $set: { images: doc.images } }).exec();
        modified++;
      }catch(e){
        console.error('[norm] failed update', doc.product_id, e.message);
      }
    }
  }
  console.log('[norm] done total=', total, 'modified=', modified);
  process.exit(0);
}

normalize().catch(e=>{ console.error(e); process.exit(2); });
