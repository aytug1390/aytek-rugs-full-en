// scripts/import_colors_images_from_csv.mjs
// usage:
//   MONGO_URI="mongodb://localhost:27017/aytekdb" node scripts/import_colors_images_from_csv.mjs path/to/file.csv --dry
//   MONGO_URI="mongodb://localhost:27017/aytekdb" node scripts/import_colors_images_from_csv.mjs path/to/file.csv --apply

import fs from "fs";
import { parse } from "csv-parse/sync";
import { MongoClient } from "mongodb";

const file = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!file) {
  console.error("CSV dosyası verin. Örn: node scripts/import_colors_images_from_csv.mjs C:\\data\\colors.csv --dry");
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aytekdb";

function hexToRgb(hex) {
  if (!hex) return null;
  let s = String(hex).trim().toLowerCase();
  if (!s || s === "null" || s === "undefined") return null;
  if (!s.startsWith("#")) s = "#"+s;
  if (s.length === 4) s = "#"+s[1]+s[1]+s[2]+s[2]+s[3]+s[3];
  const n = parseInt(s.slice(1), 16);
  if (Number.isNaN(n)) return null;
  return { r: (n>>16)&255, g:(n>>8)&255, b:n&255 };
}
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0, s=0, l=(max+min)/2;
  if (max!==min){
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d + (g<b?6:0); break;
      case g: h=(b-r)/d + 2; break;
      case b: h=(r-g)/d + 4; break;
    }
    h*=60;
  }
  return {h,s,l};
}
// kaba renk “bucket”ı
function bucketFromHex(hex){
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const {h,s,l} = rgbToHsl(rgb.r,rgb.g,rgb.b);
  if (l >= 0.93) return "white";
  if (l <= 0.07) return "black";
  if (s <= 0.12) return "gray";
  // bej: düşük sat, yüksek ışıklılık
  if (s < 0.25 && l > 0.75) return "beige";
  // kahverengi: turuncu aralığında koyu
  if (h >= 15 && h < 45) return (l < 0.5 ? "brown" : "orange");
  if (h >= 45 && h < 65) return "yellow";
  if (h >= 65 && h < 150) return "green";
  if (h >= 150 && h < 190) return "teal";
  if (h >= 190 && h < 250) return "blue";
  if (h >= 250 && h < 290) return "purple";
  if (h >= 290 && h < 345) return "pink";
  return "red"; // 345–360 & 0–15
}
function uniq(arr){ return [...new Set(arr.filter(Boolean))]; }

function driveIdFromUrl(u){
  if (!u) return null;
  const m1 = String(u).match(/[?&]id=([^&]+)/);
  if (m1) return m1[1];
  const m2 = String(u).match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m2) return m2[1];
  return null;
}
function driveViewUrl(u){
  const id = driveIdFromUrl(u);
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : null;
}

const csvText = fs.readFileSync(file, "utf8");
const rows = parse(csvText, { columns:true, skip_empty_lines:true, trim:true });

const client = new MongoClient(MONGO_URI, { ignoreUndefined:true });

(async ()=>{
  try{
    await client.connect();
  }catch(err){
    console.error("DB connect failed:", err.message);
    process.exit(2);
  }
  const db = client.db();
  const col = db.collection("products");

  let scanned=0, found=0, updated=0, missing=0;

  for (const row of rows){
    scanned++;
    const sku = String(row.sku || row.SKU || "").trim();
    if (!sku) continue;

    const hexes = uniq([row.color1, row.color2, row.color3].map(x=>x?.toLowerCase()));
    const buckets = uniq(hexes.map(bucketFromHex)).slice(0,3);
    const img = (row.error && row.error.toLowerCase()==="no-image") ? null : driveViewUrl(row.image);

    const set = {};
    if (hexes.length) set.color_hex = hexes;
    if (buckets.length) set.color_code = buckets;
    if (img !== null) { set.image_url = img; set.has_image = !!img; }
    if (img === null) { set.image_url = null; set.has_image = false; }

    const exist = await col.findOne({ product_id: sku }, { projection:{ _id:1 }});
    if (!exist){ missing++; continue; }
    found++;

    if (Object.keys(set).length===0) continue;

    if (APPLY){
      await col.updateOne({ product_id: sku }, { $set: set });
      updated++;
    } else {
      console.log(`[dry] ${sku} ->`, set);
    }
  }

  console.log(`\nScanned: ${scanned}, Matched in DB: ${found}, Updated: ${updated}, Missing SKUs: ${missing} ${APPLY?"":"(dry)"}`);
  await client.close();
})();
