const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const Quote   = require("../models/Quote");

const router = express.Router();

// uploads klasörü
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename:   (_, file, cb) => {
    const id = Date.now() + "-" + Math.round(Math.random()*1e9);
    cb(null, id + path.extname(file.originalname).toLowerCase());
  }
});
const upload = multer({ storage, limits: { files: 5, fileSize: 8 * 1024 * 1024 } });

router.post("/", upload.array("photos", 5), async (req, res) => {
  try {
    const b = req.body;
    const photos = (req.files || []).map(f => `/uploads/${f.filename}`);
    const doc = await Quote.create({
      name: b.name, phone: b.phone, email: b.email, zip: b.zip,
      service: b.service, rugSize: b.rugSize, issue: b.issue,
      message: b.message, photos, utm: JSON.parse(b.utm || "{}"),
    });
    // TODO: e-posta / Slack bildirimleri buraya eklenir
    res.status(201).json({ ok: true, id: doc._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "quote_create_failed" });
  }
});

module.exports = router;
