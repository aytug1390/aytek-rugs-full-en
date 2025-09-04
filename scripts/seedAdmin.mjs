import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Navbar menüsünde 'Services' başlığını 'Repair & Cleaning' olarak güncelle
import MenuItem from "../models/MenuItem.js";

async function updateMenu() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aytek-rugs");
  await MenuItem.updateOne({ label: "Services" }, { $set: { label: "Repair & Cleaning" } });
  await mongoose.disconnect();
  console.log("Menu updated: 'Services' -> 'Repair & Cleaning'");
}

updateMenu();
async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI missing');
  await mongoose.connect(uri);
  const args = process.argv.slice(2).filter(Boolean);
  const email = args[0] && !args[0].startsWith('--') ? args[0] : 'admin@aytek.com';
  const pass = args[1] && !args[1].startsWith('--') ? args[1] : 'changeMe123!';
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const force = flags.has('--reset');

  const existing = await User.findOne({ email });
  if (!existing) {
    const passwordHash = await bcrypt.hash(pass, 10);
    await User.create({ email, passwordHash, roles: ['admin'] });
    console.log('✅ Admin created:', email);
  } else if (force || !existing.passwordHash) {
    const passwordHash = await bcrypt.hash(pass, 10);
    existing.passwordHash = passwordHash;
    if (!existing.roles || !existing.roles.includes('admin')) {
      existing.roles = Array.isArray(existing.roles) ? Array.from(new Set([...existing.roles, 'admin'])) : ['admin'];
    }
    await existing.save();
    console.log('🔄 Admin password updated for:', email);
  } else {
    console.log('User already exists (no changes):', email);
  }
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
