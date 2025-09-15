import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import adminProducts from "./routes/adminProducts.js";
import gmcFeed from "./routes/gmcFeed.js";
// driveProxy route moved inline below (image proxy)

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Basic hardening (helmet-lite)
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("x-content-type-options", "nosniff");
  next();
});

app.use(cors({
  origin: true,
  credentials: false
}));
app.use(express.json({ limit: "10mb" }));

// Health
app.get("/health", (_req, res) => {
  const up = process.uptime();
  res.json({ ok: true, uptime: up, mongo: mongoose.connection.readyState === 1 });
});

// Quick identity endpoint for debugging which backend is answering
app.get("/whoami", (_req, res) => {
  res.json({
    source: "tsx-server",
    port: process.env.PORT || 5000,
    mongo: {
      ok: !!mongoose.connection?.readyState,
      db: mongoose.connection?.name,
      host: mongoose.connection?.host,
    },
    mounted: ["/admin-products","/admin-api"],
  });
});

// Log some env values at startup to help debugging when run from monorepo root
console.log("[env] ADMIN_API_ORIGIN=", process.env.ADMIN_API_ORIGIN);
console.log("[env] MONGO_URI len=", process.env.MONGO_URI?.length ?? 0);

// Routers
app.use("/admin-products", adminProducts);
// Alias for older or alternate upstreams that expect /admin-api/*
app.use("/admin-api", adminProducts);
app.use("/", gmcFeed);        // /gmc.csv altında

// Image proxy route: /api/drive?src=<url> OR /api/drive?id=<gdriveId>&export=view
import fetch from "node-fetch";
app.get("/api/drive", async (req, res) => {
  try {
    const { src, id, export: exp, sz } = req.query as { src?: string; id?: string; export?: string; sz?: string };
    let url: URL | null = null;

    if (src) {
      url = new URL(src as string);
    } else if (id) {
      const e = exp || "view";
      url = new URL(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id as string)}&export=${encodeURIComponent(e)}`);
    } else {
      return res.status(400).json({ error: "missing_src_or_id" });
    }

    // drive.google.com/uc?... → usercontent’e çevir
    if (url.hostname === "drive.google.com" && url.pathname.startsWith("/uc")) {
      const fid = url.searchParams.get("id");
      const e = url.searchParams.get("export") || "view";
      if (fid) url = new URL(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(fid)}&export=${encodeURIComponent(e)}`);
    }

    // lh3 için boyut suffix ekle (yoksa)
    if (url.hostname === "lh3.googleusercontent.com") {
      const size = sz || "1600";
      if (!/=s\d+/.test(url.pathname) && !/=w\d+/.test(url.pathname)) {
        url = new URL(url.toString() + `=s${size}`);
      }
    }

    const upstream = await fetch(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" },
      redirect: "follow",
    });

    if (!upstream.ok || !upstream.body) {
      // Upstream error: return a small inline PNG placeholder instead of JSON
      const placeholderBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
      const img = Buffer.from(placeholderBase64, 'base64');
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, immutable");
      res.setHeader("X-Drive-Proxy", "placeholder");
      res.setHeader("X-Upstream-Status", String(upstream?.status ?? ''));
      try {
        console.warn('[drive-proxy] served placeholder', { requested: url.toString(), upstreamStatus: upstream?.status });
      } catch (e) {
        console.warn('[drive-proxy] served placeholder (unable to serialize url/upstreamStatus)');
      }
      return res.status(200).send(img);
    }

    const type = upstream.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, immutable");
    res.setHeader("X-Drive-Proxy", "proxied");
    res.setHeader("X-Upstream-Status", String(upstream.status));
    upstream.body.pipe(res);
  } catch (e: any) {
    console.error("[/api/drive] error:", e?.message);
    // On unexpected server error, return placeholder image to avoid browser CORB for <img> requests
    try {
      const placeholderBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
      const img = Buffer.from(placeholderBase64, 'base64');
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, immutable");
      res.setHeader("X-Drive-Proxy", "placeholder");
      try {
        console.warn('[drive-proxy] served placeholder (exception)', { requested: (req.query.src || req.query.id) ?? '<unknown>', error: e?.message ?? String(e) });
      } catch (e2) {
        console.warn('[drive-proxy] served placeholder (exception)');
      }
      return res.status(200).send(img);
    } catch (e2) {
      return res.status(500).json({ error: "server_error" });
    }
  }
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("[api] unhandled", err);
  // Keep client-friendly response
  res.status(500).json({ ok: false, error: "internal" });
});

// Log unexpected rejections / exceptions so PM/console picks them up
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e));
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e));

// Start
(async () => {
  const uri = process.env.MONGO_URI;
  if (uri) {
    try {
      await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined });
      console.log("[api] Mongo connected");
    } catch (err: any) {
      console.warn("[api] Mongo connection failed, continuing with in-memory fallback:", err && err.message ? err.message : err);
    }
  } else {
    console.log("[api] MONGO_URI not set — running with in-memory fallback store");
  }

// --- TEMP: minimal Product model (only fields used by this quick handler)
const TempProduct =
  mongoose.models.ProductTemp ||
  mongoose.model(
    "ProductTemp",
    new mongoose.Schema(
      {
        product_id: String,
        title: String,
        image_url: String,
        color_hex: String,
        size_text: String,
        origin: String,
        width: Number,
        height: Number,
        status: String,
        visibility: String,
      },
      { collection: "products" }
    )
  );

// --- TEMP: /admin-api/products (GET)
app.get("/admin-api/products", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.max(1, Math.min(200, Number(req.query.limit ?? 24)));

    const q: any = {};

    if (req.query.has_image === "1") {
      q.image_url = { $exists: true, $ne: "" };
    }
    if (req.query.status) q.status = String(req.query.status);
    if (req.query.visibility) q.visibility = String(req.query.visibility);

    const minW = Number(req.query.min_width ?? 0);
    const maxW = Number(req.query.max_width ?? 0);
    if (minW || maxW) {
      q.width = {};
      if (minW) q.width.$gte = minW;
      if (maxW) q.width.$lte = maxW;
    }

    const total = await TempProduct.countDocuments(q);
    const items = await TempProduct.find(q)
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "product_id title image_url color_hex size_text origin width height status visibility"
      )
      .lean();

    res.json({ total, items, page, limit, filters: q });
  } catch (err: any) {
    console.error("[/admin-api/products] error:", err);
    res.status(500).json({ error: "server_error", message: err?.message });
  }
});

  app.listen(PORT, () => console.log(`[api] listening on http://127.0.0.1:${PORT}`));
})();
