import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", "..", ".env.local") });

const COLLECTION = process.env.PRODUCTS_COLL || "products";
const toDriveUrl = (id) => `/api/drive?id=${encodeURIComponent(id)}`;
const buildFilterForPid = (pid) => {
  const num = Number(pid);
  const or = [{ product_id: String(pid) }];
  if (!Number.isNaN(num)) or.push({ product_id: num });
  return { $or: or };
};

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath || !fs.existsSync(csvPath)) { console.error("CSV bulunamadı:", csvPath); process.exit(1); }
  if (!process.env.MONGO_URI) { console.error("MONGO_URI yok."); process.exit(1); }

  const rows = parse(fs.readFileSync(csvPath, "utf8"), { columns: true, skip_empty_lines: true });
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || "aytekdb" });
  const coll = mongoose.connection.db.collection(COLLECTION);
  console.log("[bulk-fixed] Koleksiyon:", COLLECTION);

  let updated = 0, notFound = 0, noIds = 0;
  for (const r of rows) {
    const pid = String(r.product_id || "").trim();
    if (!pid) continue;
    const ids = Object.entries(r).filter(([k]) => k === "file_ids" || k.startsWith("file_id") || k === "ids")
      .flatMap(([, v]) => String(v).split(",")).map(s => s.trim()).filter(Boolean);
    if (!ids.length) { noIds++; continue; }
    const images = ids.map((id, i) => ({ url: toDriveUrl(id), alt: `Product ${pid} Image ${i+1}`, isPrimary: i===0 }));
    const res = await coll.updateOne(buildFilterForPid(pid), { $set: { images } }, { upsert: false });
    if (res.matchedCount > 0) { updated++; console.log(`[bulk-fixed] ${pid}: ${images.length} görsel set edildi`); }
    else { notFound++; console.warn(`[bulk-fixed] ${pid}: bulunamadı`); }
  }
  console.log(`[bulk-fixed] Tamamlandı. Güncellenen: ${updated}, Bulunamadı: ${notFound}, IDsiz: ${noIds}`);
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
