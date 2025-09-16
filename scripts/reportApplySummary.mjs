import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

const CSV = path.join(process.cwd(), "missing_images.csv");

function clean(s){ return (s??"").toString().trim(); }
function uniq(a){ return [...new Set(a)]; }

const raw = await fs.readFile(CSV, "utf8");
const rows = parse(raw, { columns:true, skip_empty_lines:true });
const skus = uniq(rows.map(r => clean(r.product_id)).filter(Boolean));

try { (await import("dotenv")).default.config(); } catch {}
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
const dbEnv = clean(process.env.MONGO_DB || "");

if (!uri) {
  console.error("HATA: MONGO_URI/MONGODB_URI tanimli degil.");
  process.exit(2);
}

const { MongoClient } = await import("mongodb");
const client = new MongoClient(uri);
await client.connect();
try {
  let dbName = dbEnv;
  if (!dbName) {
    const u = new URL(uri.replace("mongodb+srv://","mongodb://"));
    dbName = u.pathname.replace(/^\//, "");
  }
  const db = dbName ? client.db(dbName) : client.db();
  const col = db.collection("products");

  let updated = 0, zeroImages = 0, missing = 0;
  for (const sku of skus) {
    const doc = await col.findOne({ $or:[{product_id:sku},{sku}] }, { projection:{ images:1 } });
    if (!doc) { missing++; continue; }
    const n = Array.isArray(doc.images) ? doc.images.length : 0;
    if (n > 0) updated++; else zeroImages++;
  }
  console.log(JSON.stringify({ totalCsvSkus: skus.length, updated, zeroImages, missing }, null, 2));
} finally {
  await client.close();
}
