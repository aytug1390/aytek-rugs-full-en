import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", "..", ".env.local") });

function toDriveUrl(id) {
  return `/api/drive?id=${encodeURIComponent(id)}`;
}

function buildFilterForPid(pid) {
  const num = Number(pid);
  const or = [{ product_id: String(pid) }];
  if (!Number.isNaN(num)) or.push({ product_id: num });
  return { $or: or };
}

async function detectCollection(db, pids) {
  const names = await db.listCollections().toArray();
  // Filtre: sistem koleksiyonlarını at
  const candidateNames = names
    .map((n) => n.name)
    .filter((n) => !n.startsWith("system.") && !n.startsWith("fs."));

  let best = { name: null, hits: -1 };

  for (const collName of candidateNames) {
    const coll = db.collection(collName);
    // 5 örnek pid ile hızlı tarama
    const sample = Array.from(pids).slice(0, 5);
    let hits = 0;
    for (const pid of sample) {
      const doc = await coll.findOne(buildFilterForPid(pid), { projection: { _id: 1 } });
      if (doc) hits++;
    }
    if (hits > best.hits) best = { name: collName, hits };
  }

  return best;
}

async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), "images-map.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("CSV bulunamadı:", csvPath);
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI yok. .env.local kontrol edin.");
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = parse(csvText, { columns: true, skip_empty_lines: true });
  if (!rows.length) {
    console.error("CSV boş görünüyor.");
    process.exit(1);
  }

  const pids = new Set(rows.map(r => String(r.product_id || "").trim()).filter(Boolean));

  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || "aytekdb" });
  const db = mongoose.connection.db;
  console.log("[bulk-auto] Mongo bağlandı. PID sayısı:", pids.size);

  const best = await detectCollection(db, pids);
  if (!best.name || best.hits <= 0) {
    console.error("[bulk-auto] Uygun koleksiyon bulunamadı. Koleksiyon adlarını ve product_id alanını kontrol edin.");
    const names = await db.listCollections().toArray();
    console.log("Koleksiyonlar:", names.map(n => n.name));
    process.exit(1);
  }
  console.log(`[bulk-auto] Kullanılacak koleksiyon: ${best.name} (örnek eşleşme sayısı: ${best.hits})`);

  const coll = db.collection(best.name);

  let updated = 0, notFound = 0, noIds = 0;
  for (const row of rows) {
    const pid = String(row.product_id || "").trim();
    if (!pid) continue;

    const ids = Object.entries(row)
      .filter(([k]) => k === "file_ids" || k.startsWith("file_id") || k === "ids")
      .flatMap(([, v]) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) { noIds++; continue; }

    const images = ids.map((id, idx) => ({
      url: toDriveUrl(id),
      alt: `Product ${pid} Image ${idx + 1}`,
      isPrimary: idx === 0,
    }));

    const res = await coll.updateOne(
      buildFilterForPid(pid),
      { $set: { images } },
      { upsert: false }
    );

    if (res.matchedCount > 0) {
      updated++;
      console.log(`[bulk-auto] ${pid}: ${images.length} görsel set edildi`);
    } else {
      notFound++;
      console.warn(`[bulk-auto] ${pid}: Eşleşen ürün bulunamadı`);
    }
  }

  console.log(`[bulk-auto] Tamamlandı. Güncellenen: ${updated}, Bulunamadı: ${notFound}, IDsiz satır: ${noIds}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
