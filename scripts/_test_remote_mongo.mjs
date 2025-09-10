import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
(async ()=>{
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) { console.error('no-uri'); process.exit(2); }
    console.log('testing remote uri (hidden) ...');
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined, serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
    console.log('connected-remote-ok');
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('connection-failed', e && e.message ? e.message : String(e));
    process.exit(1);
  }
})();
