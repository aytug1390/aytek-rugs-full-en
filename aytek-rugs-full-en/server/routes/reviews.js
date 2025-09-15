const router = require("express").Router();
const Review = require("../models/Review");

// Create
router.post("/", async (req, res) => {
  try {
    const { product_id, rating, comment, name, email } = req.body;
    if (!product_id || !rating || !name) {
      return res.status(400).json({ error: "product_id, rating, name zorunlu." });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "rating 1–5 arası olmalı." });
    }
    const review = await Review.create({ product_id, rating, comment, name, email });
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message || "create error" });
  }
});

// List (ürüne göre + pagination)
router.get("/", async (req, res) => {
  const { product_id, page = 1, limit = 20, include_unapproved } = req.query;
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(parseInt(limit) || 20, 100);

  const filter = {};
  if (product_id) filter.product_id = product_id;
  if (!include_unapproved) filter.is_approved = true; // default only approved

  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((p-1)*l).limit(l).lean(),
    Review.countDocuments(filter),
  ]);

  res.json({ items, total, page: p, pages: Math.ceil(total/l) });
});

// Ortalama puan (ürün bazlı)
router.get("/avg", async (req, res) => {
  const { product_id } = req.query;
  if (!product_id) return res.status(400).json({ error: "product_id gerekli" });

  const agg = await Review.aggregate([
    { $match: { product_id, is_approved: true } },
    { $group: { _id: "$product_id", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  res.json(agg[0] || { _id: product_id, avg: 0, count: 0 });
});
// PATCH /admin-api/reviews/:id/approve
router.patch("/:id/approve", async (req, res) => {
  const { id } = req.params;
  const doc = await Review.findByIdAndUpdate(id, { $set: { is_approved: true } }, { new: true });
  if (!doc) return res.status(404).json({ error: "not found" });
  res.json(doc);
});

module.exports = router;
