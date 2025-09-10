import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: './.env.local' });
const uri = process.env.MONGO_URI;
if(!uri){ console.error('MONGO_URI not found'); process.exit(1); }

async function run(){
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined, autoIndex: false });
  const coll = mongoose.connection.db.collection('products');
  const q = { $or: [ { title: { $regex: 'Cappadocia', $options: 'i' } }, { description: { $regex: 'Cappadocia', $options: 'i' } } ] };
  const proj = { product_id:1, title:1, description:1, origin:1, size:1, size_text:1, color:1, images:1, updatedAt:1 };
  const docs = await coll.find(q, { projection: proj }).limit(50).toArray();
  console.log('Found', docs.length, 'documents');
  docs.forEach(d=>{
    console.log('---');
    console.log(' _id:', d._id?.toString());
    console.log(' product_id:', d.product_id);
    console.log(' title:', d.title);
    console.log(' origin:', d.origin);
    console.log(' size:', d.size || d.size_text);
    console.log(' color:', JSON.stringify(d.color));
    if(d.images && d.images.length) console.log(' images[0].alt:', d.images[0].alt);
  });
  await mongoose.disconnect();
}
run().catch(err=>{ console.error(err); process.exit(2); });
