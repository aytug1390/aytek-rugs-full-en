import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function main(){
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env.local');
    process.exit(1);
  }
  try {
    const m = await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || undefined });
    console.log('[diag] connected to DB:', mongoose.connection.name);
    const coll = mongoose.connection.db.collection('products');
    const total = await coll.countDocuments();
    const withImages = await coll.countDocuments({ images: { $exists: true, $ne: [] } });
    const noImages = total - withImages;
    console.log('[diag] total products:', total);
    console.log('[diag] with images:', withImages, 'without images:', noImages);
    const sample = await coll.find({}, { projection: { product_id:1 } }).sort({ _id: -1 }).limit(5).toArray();
    console.log('[diag] newest product_ids sample:', sample.map(s=>s.product_id));
    await mongoose.disconnect();
    process.exit(0);
  } catch (e){
    console.error(e);
    process.exit(2);
  }
}

main();
