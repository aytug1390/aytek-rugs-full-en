

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
