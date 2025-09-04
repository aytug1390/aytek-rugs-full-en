
import 'dotenv/config';
import '../db.js';
import multer from "multer";
import csv from "fast-csv";
import { Router } from "express";
import Product from "../models/Product.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/admin-api/import/images-map", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file required" });

  const updates = [];
  await new Promise((resolve, reject) => {
    csv.parseString(req.file.buffer.toString("utf8"), { headers: true, ignoreEmpty: true })
      .on("error", reject)
      .on("data", (row) => updates.push(row))
      .on("end", resolve);
  });

  let updated = 0, missing = [];
  for (const r of updates) {
    const sku = (r.product_id || "").trim();
    if (!sku) continue;
    const patch = {};
    if (r.main_image) patch.main_image = r.main_image;
  if (r.images !== undefined) patch.images = r.images.split('|').map(s => s.trim()).filter(Boolean); // pipe-separated stringi array'e çevir
    if (!Object.keys(patch).length) continue;

    const doc = await Product.findOneAndUpdate({ product_id: sku }, { $set: patch }, { new: true });
    if (doc) updated++; else missing.push(sku);
  }
  res.json({ updated, missing });
});

export default router;
