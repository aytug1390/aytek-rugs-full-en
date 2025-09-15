import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI missing in environment (.env)');
  process.exit(1);
}

mongoose.set('strictQuery', true);

mongoose.connect(MONGO_URI)
  .then(() => console.log('[api] Mongo connected to DB:', mongoose.connection.name))
  .catch(err => { console.error('[api] Mongo error', err); process.exit(1); });

export default mongoose;
