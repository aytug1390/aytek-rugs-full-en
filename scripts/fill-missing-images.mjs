import { MongoClient } from "mongodb";
import fs from "node:fs/promises";
import "dotenv/config";

// Usage: NODE_ENV=development node scripts/fill-missing-images.mjs
// Requires a local mapping file at ./scripts/sku_to_driveid.json

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is required in .env to run this script");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    const mapRaw = await fs.readFile("./scripts/sku_to_driveid.json", "utf8");
    const map = JSON.parse(mapRaw);

    await client.connect();
    const db = client.db();
    const col = db.collection("products");

    const cursor = col.find({ $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] }, { projection: { product_id: 1 } });
    let n = 0;
    for await (const p of cursor) {
      const driveId = map[p.product_id];
      if (!driveId) continue;
      await col.updateOne({ _id: p._id }, {
        $set: { images: [{ url: `/api/drive?id=${driveId}&sz=1600` }] }
      });
      n++;
    }
    console.log("updated:", n);
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
