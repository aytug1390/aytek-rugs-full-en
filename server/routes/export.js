const express = require("express");
const Product = require("../models/Product");
const router = express.Router();

const join = (arr, sep = "|") => (Array.isArray(arr) ? arr.join(sep) : "");

router.get("/export/gmc.csv", async (req, res) => {
  const items = await Product.find({ status: "active" }).lean();
  const rows = [];
  rows.push([
    "id","title","description","link","image_link","additional_image_link",
    "availability","price","condition","brand","gtin","mpn",
    "google_product_category","color","material","pattern","age_group","gender","size"
  ].join(","));

  for (const p of items) {
    const primary = (p.images || []).find(i => i.isPrimary) || p.images?.[0];
    const add = (p.images || []).slice(1).map(i => i.url).join(",");
    const price = `${(p.price?.amount || 0).toFixed(2)} ${p.price?.currency || "USD"}`;
    rows.push([
      p.product_id,
      JSON.stringify(p.title || ""), // virgül kaçış
      JSON.stringify(p.description_html || ""),
      "https://yourfuturestore.com/products/" + (p.slug || p.product_id),
      primary?.url || "",
      add,
      p.availability || "in stock",
      price,
      p.condition || "vintage",
      p.brand || "Aytek Rugs",
      p.gtin || "",
      p.mpn || "",
      "Home & Garden > Decor > Rugs",
      join(p.color, " "),
      p.material || "",
      join(p.pattern, " "),
      "adult",
      "unisex",
      p.size_text || ""
    ].join(","));
  }

  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition","attachment; filename=gmc_export.csv");
  res.send(rows.join("\n"));
});

module.exports = router;
