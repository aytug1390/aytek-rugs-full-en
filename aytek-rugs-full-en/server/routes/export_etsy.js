const express = require("express");
const Product = require("../models/Product");
const router = express.Router();

router.get("/export/etsy.csv", async (req, res) => {
  const items = await Product.find({ status: "active" }).lean();
  const head = [
    "Title","Description","Price","Quantity","SKU","Tags","Materials",
    "Image1","Image2","Image3","Who_made","Is_supply","When_made","Section"
  ].join(",");
  const rows = [head];

  for (const p of items) {
    const tags = (p.tags||[]).slice(0,13);
    const images = (p.images||[]).map(i => i.url);
    rows.push([
      JSON.stringify(p.title||""),
      JSON.stringify(p.description_html||""),
      (p.price?.amount||0).toFixed(2),
      1,
      p.product_id,
      JSON.stringify(tags.join(", ")),
      JSON.stringify((p.material||"").replace(/,/g," ")),
      images[0]||"", images[1]||"", images[2]||"",
      "someone_else","false", (p.year||"made_to_order"), ""
    ].join(","));
  }

  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition","attachment; filename=etsy_export.csv");
  res.send(rows.join("\n"));
});

module.exports = router;
