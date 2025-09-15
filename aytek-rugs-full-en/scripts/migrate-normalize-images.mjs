import 'dotenv/config';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function normalize() {
  console.log('Connecting and scanning products...');
  const cursor = Product.find({}).cursor();
  let touched = 0;
  for await (const doc of cursor) {
    const imgs = doc.images || [];
    let changed = false;
    if (imgs.length && typeof imgs[0] === 'string') {
      const objs = imgs.map(u => ({ url: u, alt: '', isPrimary: false }));
      objs[0].isPrimary = true;
      doc.images = objs;
      changed = true;
    }
    // if no images array but a main_image string exists, materialize images from main_image
    if ((!imgs || imgs.length === 0) && doc.main_image && typeof doc.main_image === 'string') {
      doc.images = [{ url: doc.main_image, alt: '', isPrimary: true }];
      changed = true;
    }
    // ensure main_image exists as a string URL if present as object
    if (doc.main_image && typeof doc.main_image !== 'string') {
      doc.main_image = doc.main_image.url || '';
      changed = true;
    }
    if (changed) {
      await doc.save();
      touched++;
    }
  }
  console.log('Done. Documents updated:', touched);
  process.exit(0);
}

normalize().catch(err => { console.error(err); process.exit(2); });
