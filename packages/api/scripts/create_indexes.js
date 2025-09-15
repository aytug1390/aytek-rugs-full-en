import "dotenv/config";
import mongoose from "mongoose";

async function main(){
  const uri = process.env.MONGO_URI;
  if(!uri){
    console.error('MONGO_URI not set in environment. Set it (e.g. from .env) and rerun.');
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined });
  const db = mongoose.connection.db;
  console.log('Connected to', uri.replace(/:\/\/.*@/, '://***@'));

  try{
    const products = db.collection('products');
    async function safeCreateIndex(spec, opts) {
      try{
        console.log('Creating index:', spec, opts || {});
        await products.createIndex(spec, opts || {});
        console.log('Created.');
      }catch(err){
        // MongoDB code 85 is IndexOptionsConflict — equivalent index exists with different options
        if (err && (err.code === 85 || err.codeName === 'IndexOptionsConflict')){
          console.warn('Index exists with different options; skipping:', spec, err.message);
        } else {
          console.error('Failed to create index', spec, err);
        }
      }
    }

    await safeCreateIndex({ product_id: 1 }, { unique: true });
  // compound index to speed up admin filters & has_image queries
  await safeCreateIndex({ status:1, visibility:1, has_image:1 });
  // category + price visibility
  await safeCreateIndex({ category: 1, price_visible: 1 });
  // availability for feed filters
  await safeCreateIndex({ availability: 1 });
  // updatedAt sort index for efficient recent-sort
  await safeCreateIndex({ updatedAt: -1 });
  // images presence index (helpful for queries filtering has images)
  await safeCreateIndex({ images: 1 });
  // keep text index if not already present
  await safeCreateIndex({ title: 'text', origin: 'text', pattern: 'text' });

    console.log('Index creation finished.');
  }catch(e){
    console.error('Index creation failed (outer):', e);
  }finally{
    await mongoose.disconnect();
    process.exit(0);
  }
}

main().catch(e=>{ console.error(e); process.exit(2) });
