import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parse } from "csv-parse/sync";

const CSV_PATH = path.join(process.cwd(), "missing_images.csv");

function toBool(v) {
  if (typeof v !== "string") return !!v;
  const s = v.trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}
function clean(s) {
  return (s ?? "").toString().replace(/\u0000/g, "").trim();
}

function groupBySku(rows) {
  const map = new Map();
  for (const r of rows) {
    const sku = clean(r.product_id);
    if (!sku) continue;
    const order = Number((r.order ?? "").toString().trim()) || 0;
    const isPrimary = toBool(r.isPrimary);
    const alt = clean(r.alt);
    const url = clean(r.url).replace(/\r+$/,"");
    if (!url) continue;
    const item = { url, alt, isPrimary, order };
    if (!map.has(sku)) map.set(sku, []);
    map.get(sku).push(item);
  }
  for (const [sku, arr] of map) {
    arr.sort((a, b) => (a.order - b.order) || (Number(b.isPrimary) - Number(a.isPrimary)));
    if (!arr.some(x => x.isPrimary) && arr.length) arr[0].isPrimary = true;
  }
  return map;
}

async function readCsv() {
  const raw = await fs.readFile(CSV_PATH, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: false });
  return rows;
}

async function applyToDb(skuMap) {
  // dotenv opsiyonel
  try { (await import("dotenv")).default.config(); } catch {}

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("HATA: MONGO_URI / MONGODB_URI tanımlı değil. --apply iptal.");
    process.exitCode = 2;
    return;
  }

  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const dbEnv = (process.env.MONGO_DB || "").trim();
    let dbName = dbEnv || new URL(uri.replace("mongodb+srv://","mongodb://")).pathname.replace(/^\//,"");
    if (!dbName) {
      console.warn("UYARI: URI içinde DB adı yok ve MONGO_DB set edilmemiş. Varsayılan DB (çoğunlukla 'test') kullanılabilir.");
    }
    const db = dbName ? client.db(dbName) : client.db();
    const col = db.collection("products");

    for (const [sku, imgs] of skuMap) {
      const images = imgs.map(({ url, alt, isPrimary }) => ({ url, alt, isPrimary }));
      const filter = { $or: [{ product_id: sku }, { sku }] };

      const existing = await col.findOne(filter, { projection: { _id: 1, product_id: 1, sku: 1 } });
      if (!existing) {
        console.warn(`[SKIP] '${sku}' için eşleşen ürün bulunamadı (product_id/sku).`);
        continue;
      }

      const res = await col.updateOne({ _id: existing._id }, { $set: { images } });
      console.log(`[APPLY] ${sku} -> matched:${res.matchedCount}, modified:${res.modifiedCount}`);
    }
  } finally {
    await client.close();
  }
}

async function main() {
  const APPLY = process.argv.includes("--apply");
  const JSON_OUT = process.argv.includes("--json");

  console.log(APPLY ? "[APPLY] DB'ye yazılacak." : "[DRY RUN] Sadece çıktı, DB yazımı yok.");
  console.log("CSV:", CSV_PATH);

  const rows = await readCsv();
  console.log("Satır sayısı:", rows.length);
  const skuMap = groupBySku(rows);
  console.log("SKU sayısı:", skuMap.size);

  for (const [sku, imgs] of skuMap) {
    const printable = imgs.map(({ url, alt, isPrimary, order }) => ({ order, isPrimary, alt, url }));
    if (JSON_OUT) {
      console.log(JSON.stringify({ sku, images: printable }, null, 2));
    } else {
      console.log(`\n=== ${sku} ===`);
      console.table(printable);
    }
  }

  if (APPLY) {
    await applyToDb(skuMap);
  } else {
    console.log("\n(DRY RUN tamamlandı — hiçbir veri yazılmadı.)");
  }
}

main().catch(err => {
  console.error("Beklenmeyen hata:", err?.stack || err);
  process.exitCode = 1;
});
