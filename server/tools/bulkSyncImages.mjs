import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import dotenv from "dotenv";

// __dirname eşdeğeri
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local yükle
dotenv.config({ path: path.join(__dirname, "..", "..", ".env.local") });

// --- Model (yalın) ---
const ProductSchema = new mongoose.Schema(
  {
    product_id: { type: String, index: true },
    images: [
      { url: String, alt: String, isPrimary: Boolean },
    ],
  },
  { collection: "products" }
);
const Product = mongoose.model("Product", ProductSchema);

// --- Helpers ---
const toDriveUrl = (id) => `https://drive.google.com/uc?export=view&id=${id}`;

async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), "images-map.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("CSV bulunamadı:", csvPath);
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI env eksik. .env.local dosyasına ekleyin.");
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = parse(csvText, { columns: true, skip_empty_lines: true });

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB || "aytekdb",
  });
  console.log("[bulk] Mongo bağlandı");

  let updated = 0;
  for (const row of rows) {
    const pid = String(row.product_id || "").trim();
    if (!pid) continue;

    // Sütunlar: "file_ids" (virgülle) veya "file_id1,file_id2,..."
    const ids = Object.entries(row)
      .filter(([k]) => k === "file_ids" || k.startsWith("file_id") || k === "ids")
      .flatMap(([, v]) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      console.warn(`[bulk] ${pid}: file_ids yok, atlandı`);
      continue;
    }

    const images = ids.map((id, idx) => ({
      url: toDriveUrl(id),
      alt: `Product ${pid} Image ${idx + 1}`,
      isPrimary: idx === 0,
    }));

    const res = await Product.updateOne(
      { product_id: pid },
      { $set: { images } },
      { upsert: false }
    );

    if (res.matchedCount > 0) {
      updated += 1;
      console.log(`[bulk] ${pid}: ${images.length} görsel set edildi`);
    } else {
      console.warn(`[bulk] ${pid}: DB'de eşleşen ürün bulunamadı`);
    }
  }

  console.log(`[bulk] Tamamlandı. Güncellenen ürün sayısı: ${updated}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
