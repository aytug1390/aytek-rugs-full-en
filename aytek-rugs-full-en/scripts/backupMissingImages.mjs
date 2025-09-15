import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

const ROOT = process.cwd();
const CSV = path.join(ROOT, "missing_images.csv");
const OUT_DIR = path.join(ROOT, "logs");

// yardımcılar
const nowTag = () => new Date().toISOString().replace(/[:.]/g, "-");
const clean = (s) => (s ?? "").toString().trim();
const uniq = (arr) => [...new Set(arr)];

// ana iş
async function main() {
  console.log("[backup] start", new Date().toISOString());
  await fs.mkdir(OUT_DIR, { recursive: true });

  // CSV oku
  const raw = await fs.readFile(CSV, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true });
  const skus = uniq(rows.map(r => clean(r.product_id)).filter(Boolean));
  console.log("[backup] csv rows:", rows.length, "sku count:", skus.length);

  // .env dene (varsa)
  try { (await import("dotenv")).default.config(); } catch {}

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "";
  const dbNameEnv = clean(process.env.MONGO_DB);
  const report = {
    startedAt: new Date().toISOString(),
    env: { hasMongoUri: Boolean(uri), dbNameEnv },
    input: { csvRows: rows.length, skuCount: skus.length },
    result: { found: 0, missing: 0 },
    items: [],
    missingSkus: []
  };

  // Eğer DB yoksa bile rapor yaz ve çık (0 bayt çıkmaz!)
  if (!uri) {
    console.warn("[backup] MONGO_URI/MONGODB_URI yok — sadece CSV özet raporu yazılacak.");
    const file = path.join(OUT_DIR, `images_backup_${nowTag()}.json`);
    await fs.writeFile(file, JSON.stringify(report, null, 2), "utf8");
    console.log("[backup] wrote:", file);
    return;
  }

  // DB bağlan
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(uri);
  await client.connect();
  try {
    // URI içinde db adı yoksa env’den al
    let dbName = dbNameEnv;
    if (!dbName) {
      const u = new URL(uri.replace("mongodb+srv://", "mongodb://"));
      dbName = u.pathname.replace(/^\//, "");
    }
    const db = dbName ? client.db(dbName) : client.db();
    const col = db.collection("products");

    for (const sku of skus) {
      const doc = await col.findOne(
        { $or: [{ product_id: sku }, { sku }] },
        { projection: { _id: 0, product_id: 1, sku: 1, title: 1, images: 1 } }
      );
      if (doc) {
        report.items.push(doc);
      } else {
        report.missingSkus.push(sku);
      }
    }
    report.result.found = report.items.length;
    report.result.missing = report.missingSkus.length;

    const file = path.join(OUT_DIR, `images_backup_${nowTag()}.json`);
    await fs.writeFile(file, JSON.stringify(report, null, 2), "utf8");
    console.log("[backup] wrote:", file, "found:", report.result.found, "missing:", report.result.missing);
  } finally {
    await client.close();
  }
  console.log("[backup] done");
}

main().catch(err => {
  console.error("[backup] fatal:", err?.stack || err);
  process.exitCode = 1;
});
