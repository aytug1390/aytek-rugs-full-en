import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/User.js";
import MenuItem from "../models/MenuItem.js";

const URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/aytek-rugs";

async function connectOnce() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(URI);
}

async function seedAdmin({ email, pass, reset }) {
  await connectOnce();
  const targetEmail = email || "admin@aytek.com";
  const targetPass  = pass  || "changeMe123!";

  const existing = await User.findOne({ email: targetEmail });
  if (existing) {
    if (reset) {
      await User.deleteOne({ _id: existing._id });
    } else {
      console.log(`[seed-admin] Already exists: ${targetEmail}`);
      return;
    }
  }

  const passwordHash = await bcrypt.hash(targetPass, 10);
  await User.create({ email: targetEmail, passwordHash, roles: ["admin"] });
  console.log(`[seed-admin] Created admin: ${targetEmail}`);
}

async function updateMenu() {
  await connectOnce();
  const res = await MenuItem.updateOne(
    { label: "Services" },
    { $set: { label: "Repair & Cleaning" } }
  );
  console.log(`[menu-update] Matched: ${res.matchedCount ?? res.matched}, Modified: ${res.modifiedCount ?? res.modified}`);
}

async function main() {
  const args  = process.argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith("--")));
  const email = args.find(a => a.includes("@")) || null;
  const pass  = (args.find(a => a.startsWith("--pass=")) || "").split("=")[1] || null;

  try {
    if (flags.has("--menu")) {
      await updateMenu();
    } else if (flags.has("--admin")) {
      await seedAdmin({ email, pass, reset: flags.has("--reset") });
    } else {
      console.log("Usage: node scripts/seedAdmin.mjs --menu | --admin [email] [--pass=Secret123!] [--reset]");
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
