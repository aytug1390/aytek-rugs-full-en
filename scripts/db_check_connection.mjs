import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: './.env.local' });
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not found. Aborting.');
  process.exit(1);
}

async function run(){
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined, autoIndex: false });
  const conn = mongoose.connection;
  console.log('readyState=', conn.readyState, '(1 means connected)');
  const dbName = conn.db.databaseName;
  console.log('Connected to database:', dbName);
  const coll = conn.db.collection('products');
  let count = 0;
  try{
    count = await coll.countDocuments();
  }catch(e){
    console.warn('Could not count documents in products (maybe no such collection or permissions):', e.message);
  }
  console.log('Approx. products collection count:', count);
  await mongoose.disconnect();
  console.log('Disconnected.');
}

run().catch(err=>{ console.error('Error:', err); process.exit(2); });
