import '../server/db.js';
import Product from '../server/models/Product.js';

async function run(){
  console.log('[debug] connected to DB');
  const total = await Product.countDocuments().exec();
  const images0 = await Product.countDocuments({ 'images.0.url': { $exists: true, $ne: '' } }).exec();
  const images_any = await Product.countDocuments({ 'images.url': { $exists: true, $ne: '' } }).exec();
  const main_image = await Product.countDocuments({ main_image: { $exists: true, $ne: '' } }).exec();
  const active_public_images0 = await Product.countDocuments({ status: { $ne: 'draft' }, visibility: { $ne: 'private' }, 'images.0.url': { $exists: true, $ne: '' } }).exec();
  const active_public_images_any = await Product.countDocuments({ status: { $ne: 'draft' }, visibility: { $ne: 'private' }, 'images.url': { $exists: true, $ne: '' } }).exec();

  console.log('[debug] total:', total);
  console.log('[debug] images.0.url exists & non-empty:', images0);
  console.log('[debug] any images.url exists & non-empty:', images_any);
  console.log('[debug] main_image exists & non-empty:', main_image);
  console.log('[debug] active/public + images.0.url:', active_public_images0);
  console.log('[debug] active/public + images.url:', active_public_images_any);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
