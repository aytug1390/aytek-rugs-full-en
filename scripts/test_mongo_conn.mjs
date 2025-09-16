#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aytekdb';
console.log('Testing Mongo connection to:', MONGO_URI);
(async ()=>{
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: process.env.MONGO_DB || undefined,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('connected OK');
    const admin = mongoose.connection.db.admin();
    const info = await admin.serverStatus();
    console.log('serverStatus OK:', { version: info.version, uptime: info.uptime });
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('connection failed:', e.message);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  }
})();
