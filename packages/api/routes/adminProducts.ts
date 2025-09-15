import express, { Router, type Request } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const r = Router();

// In-memory fallback store when Mongo isn't available (for local testing)
const memoryStore = new Map<string, any>();
function useMemory() {
  return mongoose.connection.readyState !== 1;
}

const InMemoryStore = {
  async find(query: any) {
    let items = Array.from(memoryStore.values());
    if (query) {
      if (query.status) items = items.filter(i => i.status === query.status);
      if (query.visibility) items = items.filter(i => i.visibility === query.visibility);
      if (query.images) items = items.filter(i => Array.isArray(i.images) && i.images.length > 0);
    }
    return items;
  },
  async findOneAndUpdate(filter: any, update: any, opts: any) {
    const pid = filter.product_id;
    const existing = memoryStore.get(pid) || {};
    const merged = { ...(existing || {}), ...(update.$set || update) };
    merged.updatedAt = new Date();
    if (!merged.createdAt) merged.createdAt = new Date();
    memoryStore.set(pid, merged);
    return merged;
  },
  async deleteOne(filter: any) {
    memoryStore.delete(filter.product_id);
    return { deletedCount: 1 };
  },
  async countDocuments(query: any) {
    const items = await InMemoryStore.find(query);
    return items.length;
  },
  async updateMany(q: any, u: any) {
    const ids = q.product_id.$in || [];
    for (const id of ids) {
      const ex = memoryStore.get(id) || {};
      const merged = { ...ex, ...(u.$set || u) };
      merged.updatedAt = new Date();
      memoryStore.set(id, merged);
    }
    return { ok: true };
  }
};

// CSV helpers
const REQUIRED_MIN = ["product_id","title","price","availability","images"]; 
const CLEAN_ID = (v:any)=> String(v ?? "").trim().replace(/\.0$/, "");
const SPLIT_IMAGES = (v:any)=> String(v ?? "").split(/[,\s]+/).filter(Boolean);
function parseCsvBody(csv: string) {
  return parse(csv, { columns: true, skip_empty_lines: true, bom: true, trim: true });
}

// Robust body -> UTF-8 string converter (handles Buffer, UTF-16 LE/BE BOMs)
function toUtf8String(body: any): string {
  if (typeof body === "string") return body;
  if (Buffer.isBuffer(body)) {
    // UTF-16LE BOM
    if (body.length >= 2 && body[0] === 0xff && body[1] === 0xfe) {
      if (typeof TextDecoder !== 'undefined') return new (TextDecoder as any)('utf-16le').decode(body);
      return body.toString('utf16le');
    }
    // UTF-16BE BOM
    if (body.length >= 2 && body[0] === 0xfe && body[1] === 0xff) {
      if (typeof TextDecoder !== 'undefined') return new (TextDecoder as any)('utf-16be').decode(body);
      // Fallback: swap bytes and decode as utf16le
      const swapped = Buffer.alloc(body.length);
      for (let i = 0; i < body.length; i += 2) {
        swapped[i] = body[i+1] ?? 0;
        swapped[i+1] = body[i] ?? 0;
      }
      return swapped.toString('utf16le');
    }
    // Default UTF-8
    return body.toString('utf8');
  }
  return String(body ?? "");
}

// List
r.get("/", async (req, res) => {
  const { page=1, limit=50, status, visibility, has_image } = req.query as any;
  const q: any = {};
  if (status) q.status = status;
  if (visibility) q.visibility = visibility;
  if (has_image === "1") q.images = { $exists: true, $ne: [] };
  const store = useMemory() ? InMemoryStore : Product;
  let items = await (store as any).find(q) as any[];
  items = items.sort((a,b)=> new Date(b.updatedAt||b.createdAt).getTime() - new Date(a.updatedAt||a.createdAt).getTime());
  const total = await (store as any).countDocuments(q);
  items = items.slice((+page-1)*(+limit), (+page-1)*(+limit)+(+limit));
  res.set("x-applied-filters", JSON.stringify({ status, visibility, has_image }));
  res.json({ items, total });
});

// Create/Update
r.post("/", async (req, res) => {
  const b = req.body;
  // Safe defaults before upsert: do not override if user provided values
  if (!b.category) b.category = 'rug';
  if (typeof b.price_visible === 'undefined') b.price_visible = b.category === 'silver' ? true : false;
  const store = useMemory() ? InMemoryStore : Product;
  const up = await (store as any).findOneAndUpdate(
    { product_id: b.product_id },
    { $set: b },
    { upsert: true, new: true }
  );
  res.json(up);
});

// Delete
r.delete("/:product_id", async (req, res) => {
  const store = useMemory() ? InMemoryStore : Product;
  await (store as any).deleteOne({ product_id: req.params.product_id });
  res.json({ ok: true });
});

// Import CSV (stream-safe text body)
// Import CSV (raw body + safe encoding detection)
r.post(
  "/import-csv",
  express.raw({ type: "*/*", limit: "50mb" }) as any,
  async (req: Request, res) => {
    try {
      const csvText = toUtf8String(req.body);
      const rows = parseCsvBody(csvText);

      let inserted = 0, updated = 0, skipped = 0;
      const problems: Array<{ row: number; id?: string; reason: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i];
        const product_id = CLEAN_ID(raw.product_id);
        const title = String(raw.title ?? "").trim();
        const price = Number(raw.sale_price ?? raw.price ?? 0);
        const availability = String(raw.availability ?? "").trim() || "in stock";
        const images = Array.isArray(raw.images) ? raw.images : SPLIT_IMAGES(raw.images);

        const missing = REQUIRED_MIN.filter((k) => {
          const v = k === "images" ? images : k === "product_id" ? product_id : raw[k];
          return v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
        });
        if (missing.length) {
          problems.push({ row: i + 1, id: product_id, reason: `missing: ${missing.join(",")}` });
          skipped++;
          continue;
        }

        const body = {
          product_id,
          title,
          brand: raw.brand || "Aytek Rugs",
          price: Number(raw.price ?? 0) || undefined,
          sale_price: raw.sale_price != null ? Number(raw.sale_price) : undefined,
          price_visible: raw.price_visible != null ? (String(raw.price_visible).toLowerCase() === 'true') : undefined,
          category: raw.category ?? undefined,
          availability,
          material: raw.material ?? undefined,
          color: raw.color ? String(raw.color).split(/[|,]/).map((s: string) => s.trim()).filter(Boolean) : undefined,
          color_hex: raw.color_hex ? String(raw.color_hex).split(/[|,]/).map((s: string) => s.trim()).filter(Boolean) : undefined,
          size_text: raw.size_text ?? undefined,
          origin: raw.origin ?? undefined,
          age_group: raw.age_group ?? undefined,
          pattern: raw.pattern ?? undefined,
          images,
          status: raw.status || "active",
          visibility: raw.visibility || "public",
        };

        // Apply CSV-level safe defaults if not explicitly provided
        if (!body.category) body.category = 'rug';
        if (typeof body.price_visible === 'undefined') body.price_visible = body.category === 'silver' ? true : false;

        const useDb = (await Product.db?.readyState) === 1;
        if (useDb) {
          const prev = await Product.findOne({ product_id }).lean();
          await Product.findOneAndUpdate({ product_id }, { $set: body }, { upsert: true, new: true });
          prev ? updated++ : inserted++;
        } else {
          // In-memory fallback
          // @ts-ignore
          const mem = (global as any).__AYTEK_MEM__ ?? ((global as any).__AYTEK_MEM__ = new Map());
          const had = mem.has(product_id);
          mem.set(product_id, { ...body, createdAt: new Date(), updatedAt: new Date() });
          had ? updated++ : inserted++;
        }
      }

      return res.json({ inserted, updated, skipped, problems });
    } catch (e: any) {
      return res.status(400).json({ error: e?.message || "parse-failed" });
    }
  }
);

// Export CSV (stream-like write)
r.get("/export.csv", async (req, res) => {
  try {
    const { status, visibility, has_image } = req.query as any;
    const q: any = {};
    if (status) q.status = status;
    if (visibility) q.visibility = visibility;
    if (has_image === "1") q.images = { $exists: true, $ne: [] };

    const useDb = (await Product.db?.readyState) === 1;
    const items = useDb
      ? await Product.find(q).lean()
      : (() => {
          // @ts-ignore
          const mem: Map<string, any> = (global as any).__AYTEK_MEM__ || new Map();
          return [...mem.values()].filter(it => {
            if (q.status && it.status !== q.status) return false;
            if (q.visibility && it.visibility !== q.visibility) return false;
            if (q.images && (!it.images || it.images.length === 0)) return false;
            return true;
          });
        })();

    res.set({
      "content-type": "text/csv; charset=utf-8",
      "x-content-type-options": "nosniff",
      "content-disposition": 'attachment; filename="aytek_products_export.csv"',
      "cache-control": "no-store"
    });

    // Header
    const header = [
      "product_id","title","price","sale_price","availability","material",
      "color","color_hex","size_text","origin","age_group","pattern",
      "images","status","visibility","price_visible","category"
    ];
    res.write(header.join(",") + "\n");

    // Rows
    for (const p of items) {
      const imagesField = (() => {
        if (typeof p.image_url === "string" && p.image_url) return p.image_url;
        if (Array.isArray(p.images)) {
          const urls = p.images
            .map((it: any) => (typeof it === "string" ? it : (it?.url || it?.src || it?.image_url || "")))
            .filter(Boolean);
          return urls.join(" ");
        }
        if (typeof p.images === "string") return p.images;
        return "";
      })();

      const row = [
        p.product_id ?? "",
        `"${String(p.title ?? "").replace(/"/g, '""') }"`,
        p.price ?? "",
        p.sale_price ?? "",
        p.availability ?? "",
        p.material ?? "",
        `"${Array.isArray(p.color) ? p.color.join("|") : (p.color ?? "") }"`,
        `"${Array.isArray(p.color_hex) ? p.color_hex.join("|") : (p.color_hex ?? "") }"`,
        `"${p.size_text ?? "" }"`,
        `"${p.origin ?? "" }"`,
        p.age_group ?? "",
        `"${String(p.pattern ?? "").replace(/"/g, '""') }"`,
        `"${imagesField}"`,
        p.status ?? "",
        p.visibility ?? "",
        (p.price_visible === false ? "false" : "true"),
        p.category ?? "",
      ];
      res.write(row.join(",") + "\n");
    }

    res.end(); // close connection cleanly
  } catch (e:any) {
    res.status(500).set("content-type","text/plain; charset=utf-8")
      .send("export failed: " + (e?.message || "unknown"));
  }
});

// Bulk
r.post('/bulk', async (req,res)=>{
  const { ids, set } = req.body as any;
  if(!Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });
  const q = { product_id: { $in: ids } };
  const store = useMemory() ? InMemoryStore : Product;
  await (store as any).updateMany(q, { $set: set });
  res.json({ ok: true });
});

// POST /bulk/set-price-visibility
r.post('/bulk/set-price-visibility', express.json(), async (req,res)=>{
  const { category, price_visible } = req.body || {};
  if (typeof price_visible !== 'boolean' || !category) return res.status(400).json({ ok:false, error: 'category and price_visible required' });
  const useDb = (await Product.db?.readyState) === 1;
  if (useDb) {
    const r0 = await Product.updateMany({ category }, { $set: { price_visible } });
    const matched = (r0 as any).matchedCount ?? (r0 as any).n ?? 0;
    const modified = (r0 as any).modifiedCount ?? (r0 as any).nModified ?? (r0 as any).modified ?? 0;
    return res.json({ ok:true, matched, modified });
  } else {
    // in-memory
    // @ts-ignore
    const mem: Map<string, any> = (global as any).__AYTEK_MEM__ || new Map();
    let modified = 0;
    for (const p of mem.values()) {
      if (p.category === category) { p.price_visible = price_visible; modified++; }
    }
    return res.json({ ok:true, matched: modified, modified });
  }
});

// POST /bulk/set-origin
r.post('/bulk/set-origin', express.json(), async (req,res)=>{
  const { origin } = req.body || {};
  if (!origin) return res.status(400).json({ ok:false, error: 'origin required' });
  const useDb = (await Product.db?.readyState) === 1;
  if (useDb) {
    const r0 = await Product.updateMany(
      { $or: [{ origin: { $exists: false } }, { origin: '' }] },
      { $set: { origin } }
    );
    const matched = (r0 as any).matchedCount ?? (r0 as any).n ?? 0;
    const modified = (r0 as any).modifiedCount ?? (r0 as any).nModified ?? (r0 as any).modified ?? 0;
    return res.json({ ok:true, matched, modified });
  } else {
    // in-memory
    // @ts-ignore
    const mem: Map<string, any> = (global as any).__AYTEK_MEM__ || new Map();
    let matched = 0, modified = 0;
    for (const p of mem.values()) {
      if (!p.origin || p.origin === '') {
        matched++;
        if (p.origin !== origin) { p.origin = origin; modified++; }
      }
    }
    return res.json({ ok:true, matched, modified });
  }
});

// POST /bulk/set-category
r.post('/bulk/set-category', express.json(), async (req,res)=>{
  const { ids, where, category } = req.body || {};
  if (!category) return res.status(400).json({ ok:false, error: 'category required' });
  const query: any = where || {};
  if (Array.isArray(ids) && ids.length) query.product_id = { $in: ids };
  const useDb = (await Product.db?.readyState) === 1;
  if (useDb) {
    const r0 = await Product.updateMany(query, { $set: { category } });
    const matched = (r0 as any).matchedCount ?? (r0 as any).n ?? 0;
    const modified = (r0 as any).modifiedCount ?? (r0 as any).nModified ?? (r0 as any).modified ?? 0;
    return res.json({ ok:true, matched, modified });
  } else {
    // in-memory
    // @ts-ignore
    const mem: Map<string, any> = (global as any).__AYTEK_MEM__ || new Map();
    let matched = 0, modified = 0;
    for (const p of mem.values()) {
      const pass = !ids?.length || ids.includes(p.product_id);
      if (pass) { matched++; if (p.category !== category) { p.category = category; modified++; } }
    }
    return res.json({ ok:true, matched, modified });
  }
});

// POST /bulk/set-has-image
r.post('/bulk/set-has-image', express.json(), async (req,res)=>{
  const { where } = req.body || {};
  const query: any = where || {};
  // If no where provided, operate on all documents (caller must be careful)
  const useDb = (await Product.db?.readyState) === 1;
  if (useDb) {
    // Use an updateMany with $or to detect images in different shapes
    const mq = { ...query, $or: [
      { image_url: { $type: "string", $ne: "" } },
      { images: { $type: "array", $ne: [] } },
      { images: { $elemMatch: { $or: [
        { url: { $type: "string", $ne: "" } },
        { src: { $type: "string", $ne: "" } },
        { image_url: { $type: "string", $ne: "" } },
        { href: { $type: "string", $ne: "" } }
      ] } } }
    ] };
    const r0 = await Product.updateMany(mq, { $set: { has_image: true } });
    const matched = (r0 as any).matchedCount ?? (r0 as any).n ?? 0;
    const modified = (r0 as any).modifiedCount ?? (r0 as any).nModified ?? (r0 as any).modified ?? 0;
    return res.json({ ok:true, matched, modified });
  } else {
    // In-memory: iterate and set has_image where appropriate
    // @ts-ignore
    const mem: Map<string, any> = (global as any).__AYTEK_MEM__ || new Map();
    let matched = 0, modified = 0;
    for (const [id, p] of mem.entries()) {
      // apply where filters if provided (simple subset match)
      let pass = true;
      if (where) {
        for (const k of Object.keys(where)) {
          if ((p as any)[k] !== (where as any)[k]) { pass = false; break; }
        }
      }
      if (!pass) continue;
      const hasImage = (typeof p.image_url === 'string' && p.image_url) || (Array.isArray(p.images) && p.images.length > 0) || (Array.isArray(p.images) && p.images.some((it:any)=> typeof it === 'string' ? !!it : !!(it?.url||it?.src||it?.image_url||it?.href)));
      if (hasImage) {
        matched++;
        if (!p.has_image) { p.has_image = true; modified++; }
      }
    }
    return res.json({ ok:true, matched, modified });
  }
});

// Missing fields report (quick summary)
r.get("/missing-report", async (_req, res) => {
  const useDb = (await Product.db?.readyState) === 1;
  const gather = async () => {
    const items = useDb ? await Product.find({}).lean() : (() => {
      // @ts-ignore
      const mem: Map<string, any> = (global as any).__AYTEK_MEM__ || new Map();
      return [...mem.values()];
    })();

  const no_image: string[] = [];
  const no_origin: string[] = [];
  const no_size: string[] = [];
  const no_color: string[] = [];
  const no_price: string[] = [];
  const hidden_price: string[] = [];

    for (const p of items) {
      if (!p.images || p.images.length === 0) no_image.push(p.product_id);
      if (!p.origin) no_origin.push(p.product_id);
      if (!p.size_text) no_size.push(p.product_id);
      if (!p.color || p.color.length === 0) no_color.push(p.product_id);
      // price check: price or sale_price must be a positive finite number
      const pprice = Number(p.sale_price ?? p.price ?? NaN);
      if (!Number.isFinite(pprice) || pprice <= 0) no_price.push(p.product_id);
      if (p.price_visible === false) hidden_price.push(p.product_id);
    }
    return {
      counts: {
        no_image: no_image.length,
        no_origin: no_origin.length,
        no_size: no_size.length,
        no_color: no_color.length,
        no_price: no_price.length,
        hidden_price: hidden_price.length,
        total: items.length
      },
      sample: {
        no_image: no_image.slice(0, 20),
        no_origin: no_origin.slice(0, 20),
        no_size: no_size.slice(0, 20),
        no_color: no_color.slice(0, 20),
        no_price: no_price.slice(0, 20),
        hidden_price: hidden_price.slice(0, 20),
      }
    };
  };
  res.json(await gather());
});

export default r;
