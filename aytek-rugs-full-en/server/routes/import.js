const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const Product = require("../models/Product");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const splitMulti = (v) => (v ? String(v).split("|").map(s => s.trim()).filter(Boolean) : []);

router.post("/products", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "CSV file required" });
  const text = req.file.buffer.toString("utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true });

  let upserts = 0;
  for (const r of rows) {
    const images = splitMulti(r.images).map((url, idx) => ({ url, alt: r.title, isPrimary: idx === 0 }));
    const doc = {
      product_id: r.product_id,
      title: r.title,
      description_html: r.description_html,
      condition: r.condition || "vintage",
      availability: r.availability || "in stock",
      price: { amount: Number(r.price || 0), currency: r.currency || "USD" },
      sale_price: { amount: Number(r.sale_price || 0), active: String(r.sale_price_active) === "true" },
      material: r.material,
      color: splitMulti(r.color),
      size_text: r.size_text,
      size_cm: { w: Number(r.size_w_cm || 0), l: Number(r.size_l_cm || 0) },
      pattern: splitMulti(r.pattern),
      origin: r.origin,
      year: r.year,
      certificate_id: r.certificate_id,
      gtin: r.gtin,
      mpn: r.mpn,
      images,
      tags: splitMulti(r.tags),
      collections: splitMulti(r.collections),
      seo_title: r.seo_title,
      seo_description: r.seo_description,
      status: r.status || "draft",
      visibility: r.visibility || "private",
    };
    await Product.updateOne({ product_id: r.product_id }, { $set: doc }, { upsert: true });
    upserts++;
  }
  res.json({ ok: true, upserts });
});

module.exports = router;
