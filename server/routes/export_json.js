const express = require("express");
const Product = require("../models/Product");
const router = express.Router();

router.get("/export/products.json", async (_req, res) => {
  const items = await Product.find({}).lean();
  res.json(items);
});
module.exports = router;
