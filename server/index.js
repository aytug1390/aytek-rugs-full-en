const multer = require("multer");
const path = require("path");
require("dotenv").config();
const nodemailer = require("nodemailer");
// Multer setup (uploads klasörü)
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "uploads"));
    },
    filename: function (req, file, cb) {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + "-" + file.originalname.replace(/\s+/g, "_"));
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});
// --- Repair Service Request Route ---
app.post("/api/service/repair", upload.array("files", 6), async (req, res) => {
  try {
    const { fullName, email, phone, city, description } = req.body || {};
    const files = req.files || [];

    // Basit doğrulama
    if (!fullName || !city || !email || !description || files.length === 0) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Dosya linkleri
    const fileLinks = files.map(f => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const html = `
      <h2>New Rug Repair Request</h2>
      <p><b>Name:</b> ${fullName}</p>
      <p><b>City:</b> ${city}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone || "-"}</p>
      <h3>Repair Details</h3>
      <p>${String(description).replace(/\n/g, "<br/>")}</p>
      <h3>Rug Photo(s)</h3>
      ${fileLinks.map(l => `<a href='${l}' target='_blank'>${l}</a>`).join("<br/>")}
    `;

    await transporter.sendMail({
      from: `"Aytek Rugs Website" <${process.env.SMTP_USER}>`,
      to: process.env.SERVICE_INBOX,
      subject: "🛠️ New Repair Request - Aytek Rugs",
      replyTo: email,
      html,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Mail error:", err);
    res.status(500).json({ error: "Email send failed." });
  }
});
require("dotenv").config();

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// --- middleware ---
app.use(cors());
app.use(express.json());

// --- db ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aytek";
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("[mongo] connected"))
  .catch((e) => console.error("[mongo] error", e.message));

// Nodemailer transporter (tek sefer tanımlı)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || "true") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Designers Lead Route
const designerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});
app.post("/api/designers/lead", designerUpload.array("files"), async (req, res) => {
  try {
    const {
      fullName, email, phone, company, city, projectType,
      message, wantsMockup, preferredColors, preferredSize, preferredSKU
    } = req.body;

    if (!fullName || !email || !city || !message) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const attachments = (req.files || []).map((f) => ({
      filename: f.originalname,
      content: f.buffer,
      contentType: f.mimetype,
    }));

    const html = `
      <h2>New Designer Lead</h2>
      <p><b>Name:</b> ${fullName}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone || "-"}</p>
      <p><b>Company:</b> ${company || "-"}</p>
      <p><b>City/State:</b> ${city}</p>
      <p><b>Project Type:</b> ${projectType || "-"}</p>
      <h3>Requirements</h3>
      <p>${String(message).replace(/\n/g, "<br/>")}</p>
      <h3>Preferences</h3>
      <ul>
        <li><b>Free Mockup Requested:</b> ${String(wantsMockup) === "true" ? "Yes" : "No"}</li>
        <li><b>Preferred Colors:</b> ${preferredColors || "-"}</li>
        <li><b>Preferred Size:</b> ${preferredSize || "-"}</li>
        <li><b>SKU:</b> ${preferredSKU || "-"}</li>
      </ul>
      <p style="margin-top:12px"><i>Attachments: ${attachments.length} file(s)</i></p>
    `;

    await transporter.sendMail({
      from: `"Aytek Rugs Website" <${process.env.SMTP_USER}>`,
      to: process.env.SERVICE_INBOX,
      subject: "🎨 New Designer Request (with Free Mockup option)",
      replyTo: email,
      html,
      attachments,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Designers mail error:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
});


// --- routes ---
app.use("/api/quotes", require("./routes/quotes"));
// diğer mevcut route’ların (reviews vb) burada kalabilir:
// app.use("/api/reviews", require("./routes/reviews"));

app.get("/api/health", (_, res) => res.json({ ok: true }));

// --- Cleaning Service Request Route ---
const cleaningUpload = multer({ storage: multer.memoryStorage() });
app.post("/api/service/cleaning", cleaningUpload.array("files"), async (req, res) => {
  try {
    const { fullName, city, email, phone, notes, consent } = req.body || {};
    let sizes = [];
    try {
      sizes = JSON.parse(req.body.sizes || "[]");
    } catch { sizes = []; }
    const files = req.files || [];

    // Basit doğrulama
    if (!fullName || !city || !email || !Array.isArray(sizes) || sizes.length === 0 || files.length === 0) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const sizesText = sizes
      .map((s, i) => `#${i + 1}: ${s.width} x ${s.length} ${s.unit}`)
      .join("\n");

    const attachments = files.map((f) => ({
      filename: f.originalname,
      content: f.buffer,
    }));

    const html = `
      <h2>New Rug Cleaning Request</h2>
      <p><b>Name:</b> ${fullName}</p>
      <p><b>City:</b> ${city}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone || "-"}</p>
      <p><b>Consent:</b> ${consent ? "Yes" : "No"}</p>
      <h3>Rug Size(s)</h3>
      <pre style="font-family:monospace">${sizesText}</pre>
      ${notes ? `<h3>Notes</h3><p>${String(notes).replace(/\n/g, "<br/>")}</p>` : ""}
    `;

    await transporter.sendMail({
      from: `"Aytek Rugs Website" <${process.env.SMTP_USER}>`,
      to: process.env.SERVICE_INBOX,
      subject: "🧼 New Cleaning Request - Aytek Rugs",
      replyTo: email,
      html,
      attachments,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Mail error:", err);
    res.status(500).json({ error: "Email send failed." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Review = require("./models/Review");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB bağlan
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.error(err));

// API Routes
app.get("/api/reviews", async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 });
  res.json(reviews);
});

app.post("/api/reviews", async (req, res) => {
  const { name, rating, comment } = req.body;
  const newReview = new Review({ name, rating, comment });
  await newReview.save();
  res.json(newReview);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
