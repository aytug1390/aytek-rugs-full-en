import 'dotenv/config';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function run(){
  console.log('Running listing diagnostics...');
  const total = await Product.countDocuments();
  const totalTraditional = await Product.countDocuments({ collections: { $in: ['traditional','traditional-collection'] } });
  const withImages = await Product.countDocuments({ images: { $exists: true, $ne: [] } });
  const noImages = total - withImages;

  const placeholders = await Product.find({ title: /^Placeholder/i }).lean().limit(200).exec();
  const publicNoImages = await Product.find({ visibility: 'public', $or: [ { images: { $exists:false } }, { images: { $size: 0 } } ] }).lean().limit(200).exec();
  const newest = await Product.find({}).sort({ updatedAt: -1 }).limit(50).lean().select('product_id title status visibility collections images main_image updatedAt').exec();

  console.log('\nSummary:');
  console.log(' total products:', total);
  console.log(' total in traditional collections:', totalTraditional);
  console.log(' products with images:', withImages);
  console.log(' products without images (approx):', noImages);
  console.log(' placeholders found:', placeholders.length);
  console.log(' public products with no images (sample):', publicNoImages.length);

  console.log('\nSample placeholders (up to 50):');
  placeholders.slice(0,50).forEach(p=>{
    console.log(`  ${p.product_id} | ${p.title} | status=${p.status} | vis=${p.visibility} | cols=${JSON.stringify(p.collections||[])} | images=${(p.images||[]).length}`);
  });

  console.log('\nSample public products with no images (up to 50):');
  publicNoImages.slice(0,50).forEach(p=>{
    console.log(`  ${p.product_id} | ${p.title} | status=${p.status} | vis=${p.visibility} | cols=${JSON.stringify(p.collections||[])} | images=${(p.images||[]).length}`);
  });

  console.log('\n50 newest products:');
  newest.forEach(p=>{
    console.log(`  ${p.product_id} | ${p.title || ''} | status=${p.status} | vis=${p.visibility} | cols=${JSON.stringify(p.collections||[])} | images=${(p.images||[]).length} | updated=${p.updatedAt}`);
  });

  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
