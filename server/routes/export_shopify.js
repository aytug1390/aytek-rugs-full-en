const express = require("express");
const Product = require("../models/Product");
const router = express.Router();

router.get("/export/shopify.csv", async (req, res) => {
  const items = await Product.find({ status: "active" }).lean();
  const head = [
    "Handle","Title","Body (HTML)","Vendor","Type","Tags","Published",
    "Option1 Name","Option1 Value","Variant SKU","Variant Price","Variant Inventory Qty",
    "Image Src","Image Alt Text","SEO Title","SEO Description"
  ].join(",");

  const rows = [head];
  for (const p of items) {
    const handle = (p.slug || p.product_id).toLowerCase();
    const img = (p.images||[])[0];
    rows.push([
      handle,
      JSON.stringify(p.title||""),
      JSON.stringify(p.description_html||""),
      "Aytek Rugs",
      "Rug",
      JSON.stringify((p.tags||[]).join(", ")),
      "TRUE",
      "Title","Default Title",
      p.product_id,
      (p.price?.amount||0).toFixed(2),
      1,
      img?.url||"",
      JSON.stringify(img?.alt||p.title||""),
      JSON.stringify(p.seo_title||""),
      JSON.stringify(p.seo_description||""),
    ].join(","));
    (p.images||[]).slice(1).forEach(img2 => {
      rows.push([handle,"","","","","","","","","","","",img2.url,JSON.stringify(img2.alt||""),"",""]
      .join(","));
    });
  }

  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition","attachment; filename=shopify_export.csv");
  res.send(rows.join("\n"));
});

module.exports = router;
