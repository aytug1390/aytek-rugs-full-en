import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
console.log('MONGO_URI present?', !!uri);

(async () => {
  try {
    mongoose.set('strictQuery', true);
    console.log('Connecting...');
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected. DB name:', mongoose.connection.name);
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('Connection error:');
    console.error(err);
    process.exit(1);
  }
})();
