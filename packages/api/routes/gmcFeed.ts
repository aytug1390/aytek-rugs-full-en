import { Router } from "express";
import Product from "../models/Product";

const r = Router();

// Helpers
const asNumber = (v: any) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const pickPrice = (p: any) => {
  const s = asNumber(p?.sale_price);
  const r = asNumber(p?.price);
  return s ?? r;
};

const firstImageUrl = (p: any): string | undefined => {
  if (typeof p?.image_url === "string" && p.image_url) return p.image_url;
  const imgs = p?.images;
  if (typeof imgs === "string") return imgs;
  if (Array.isArray(imgs)) {
    for (const it of imgs) {
      if (typeof it === "string" && it) return it;
      if (it && typeof it === "object") {
        const cand = it.url || it.src || it.image_url || it.href;
        if (typeof cand === "string" && cand) return cand;
      }
    }
  }
  return undefined;
};

const stripHtml = (html?: string) => {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?\>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
};

const normalizeAvailability = (v: any) => {
  const s = String(v || "").toLowerCase();
  if (s.includes("out")) return "out of stock";
  if (s.includes("pre") || s.includes("back")) return "preorder";
  return "in stock";
};

r.get("/gmc.csv", async (_req, res) => {
  try {
    const useDb = (await Product.db?.readyState) === 1;
  const baseQuery = { status: "active", visibility: "public", price_visible: true } as any;

    const items = useDb
      ? await Product.find(baseQuery).lean()
      : (() => {
          // @ts-ignore
          const mem: Map<string, any> = (global as any).__AYTEK_MEM__ || new Map();
          return [...mem.values()].filter((it) => it.status === "active" && it.visibility === "public");
        })();

    res.set({
      "content-type": "text/csv; charset=utf-8",
      "x-content-type-options": "nosniff",
      "cache-control": "no-store",
    });

    const header = "id,title,price,link,image_link,availability,brand,condition,mpn,description\n";
    res.write(header);

    let written = 0,
      skipped = 0;

    for (const p of items) {
      const id = p.product_id || p.sku || p._id;
      const title = String(p.title || "").trim();
      const priceNum = pickPrice(p);
      const image = firstImageUrl(p);
      const availability = normalizeAvailability(p.availability);
      const brand = p.brand || "Aytek Rugs";
      const condition = (p.condition || "new").toLowerCase();
      const mpn = p.mpn || id;
      const link = `https://aytekrugs.com/rug/${encodeURIComponent(id)}`;
      const description = stripHtml(p.description_html || p.title);

      if (!id || !title || !image || !Number.isFinite(priceNum as number)) {
        skipped++;
        continue;
      }
      const priceTxt = `${(priceNum as number).toFixed(2)} USD`;

      res.write(
        [
          id,
          `"${title.replace(/"/g, '""')}"`,
          priceTxt,
          link,
          image,
          availability,
          brand,
          condition,
          mpn,
          `"${description.replace(/"/g, '""')}"`,
        ].join(",") + "\n"
      );
      written++;
    }

    res.end();
  } catch (e: any) {
    res.status(500).set("content-type", "text/plain; charset=utf-8").send("gmc feed failed: " + (e?.message || "unknown"));
  }
});

// HEAD /gmc.csv (send headers only)
r.head("/gmc.csv", (_req, res) => {
  res.set({
    "content-type": "text/csv; charset=utf-8",
    "x-content-type-options": "nosniff",
    "cache-control": "no-store",
  });
  res.end();
});

export default r;
