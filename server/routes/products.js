

const express = require("express");
const { dbConnect } = require("../../lib/db");
const Product = require("../models/Product");
const router = express.Router();

// DEBUG: MongoDB bağlantı kontrolü
router.get("/debug/mongo", async (req, res) => {
  try {
    await dbConnect();
    console.log("MongoDB bağlantısı başarılı!");
    res.json({ status: "ok", message: "MongoDB bağlantısı başarılı!" });
  } catch (err) {
    console.error("MongoDB bağlantı hatası:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// LIST with pagination & search
router.get("/", async (req, res) => {
  await dbConnect();
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const q = (req.query.q || "").trim();

  let filter = {};
  let sort = { updatedAt: -1 };

  if (q) {
    filter.$text = { $search: q };
    sort = { score: { $meta: "textScore" } };
  }

  // color filter: ?color=red or ?color=red,blue
  if (req.query.color) {
    const colors = String(req.query.color).split(',').map(s=>s.trim()).filter(Boolean);
    if (colors.length) {
      filter.color_code = { $in: colors };
    }
  }

  // origin filter: ?origin=Turkey (matches origin_country field)
  if (req.query.origin) {
    const origins = String(req.query.origin).split(',').map(s=>s.trim()).filter(Boolean);
    if (origins.length) {
      filter.origin_country = { $in: origins };
    }
  }

  // size filter: ?size=6'4" x 9'5"  (exact match in description_html or description)
  // also support width/height numeric filters: ?min_width=180&max_width=200 (cm expected)
  if (req.query.size) {
    const sz = String(req.query.size).trim();
    // naive match: look for the size string inside description_html or description
    filter.$or = filter.$or || [];
    filter.$or.push({ description_html: { $regex: sz, $options: 'i' } }, { description: { $regex: sz, $options: 'i' } });
  }

  // numeric size range filters (cm)
  const minW = req.query.min_width ? Number(req.query.min_width) : null;
  const maxW = req.query.max_width ? Number(req.query.max_width) : null;
  const minH = req.query.min_height ? Number(req.query.min_height) : null;
  const maxH = req.query.max_height ? Number(req.query.max_height) : null;
  if (minW != null || maxW != null) {
    filter.width_cm = filter.width_cm || {};
    if (minW != null) filter.width_cm.$gte = minW;
    if (maxW != null) filter.width_cm.$lte = maxW;
  }
  if (minH != null || maxH != null) {
    filter.height_cm = filter.height_cm || {};
    if (minH != null) filter.height_cm.$gte = minH;
    if (maxH != null) filter.height_cm.$lte = maxH;
  }

  // category filter: ?category=slug or ?category=12345 (matches category or category_id fields)
  if (req.query.category) {
    const cats = String(req.query.category).split(',').map(s=>s.trim()).filter(Boolean);
    if (cats.length) {
      filter.$or = filter.$or || [];
      filter.$or.push({ category: { $in: cats } }, { category_id: { $in: cats } });
    }
  }

  const cursor = Product.find(filter).sort(sort).skip((page-1)*limit).limit(limit);
  if (q) cursor.select({ score: { $meta: "textScore" } });

  const [items, total] = await Promise.all([
    cursor.lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total/limit) });
});

// CREATE
router.post("/", async (req, res) => {
  await dbConnect();
  const doc = new Product(req.body);
  await doc.save();
  res.status(201).json(doc);
});

// READ one
const mongoose = require("mongoose");
router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }
  await dbConnect();
  const doc = await Product.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});


// UPDATE (PUT)
router.put("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }
  await dbConnect();
  const doc = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

// UPDATE (PATCH)
router.patch("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }
  await dbConnect();
  const doc = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

// DELETE
router.delete("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }
  await dbConnect();
  const doc = await Product.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// BULK status/visibility
router.post("/bulk", async (req, res) => {
  await dbConnect();
  const { ids = [], set = {} } = req.body;
  if (!ids.length) return res.status(400).json({ error: "ids required" });
  await Product.updateMany({ _id: { $in: ids } }, { $set: set });
  res.json({ ok: true });
});

module.exports = router;
