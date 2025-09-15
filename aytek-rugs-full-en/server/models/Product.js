import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },   // S3 / GDrive (uc?export=view&id=...)
  alt: { type: String, default: "" },
  isPrimary: { type: Boolean, default: false },
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  // Kimlik
  product_id: { type: String, unique: true, index: true, required: true }, // SKU
  slug: { type: String, index: true }, // SEO friendly

  // Temel
  title: { type: String, required: true },
  description_html: { type: String, default: "" },  // zengin metin (Shopify/GMC uyumlu)
  condition: { type: String, enum: ["new", "vintage", "antique", "used"], default: "vintage" },
  availability: { type: String, enum: ["in stock", "out of stock", "preorder"], default: "in stock" },

  // Fiyat
  price: { amount: { type: Number, default: 0 }, currency: { type: String, default: "USD" } },
  sale_price: { amount: { type: Number, default: 0 }, active: { type: Boolean, default: false } },

  // Teknik / nitelikler
  brand: { type: String, default: "Aytek Rugs" },
  material: { type: String, default: "" },           // “100% wool”, “wool & silk”
  color: { type: [String], default: [] },            // ["Beige","Burgundy"]
  color_names: { type: [String], default: [] },      // normalized english/turkish names (computed)
  size_text: { type: String, default: "" },          // “170x240 cm” veya “8x10 ft”
  size_cm: { w: Number, l: Number },                 // sayısal ölçü (cm)
  pattern: { type: [String], default: [] },          // ["Traditional","Geometric"]
  origin: { type: String, default: "" },             // Konya / Yahyalı …
  year: { type: String, default: "" },               // “circa 1970s”
  knot_density: { type: String, default: "" },       // ops.
  pile: { type: String, default: "" },               // wool/silk pile …
  dyes: { type: String, default: "" },               // natural/vegetable/…
  backing: { type: String, default: "" },

  // Sertifika & kodlar
  certificate_id: { type: String, default: "" },
  gtin: { type: String, default: "" },
  mpn: { type: String, default: "" },

  // Medya
  images: { type: [ImageSchema], default: [] },

  // Etiketler / koleksiyonlar
  tags: { type: [String], default: [] },             // Etsy/Shopify için çok önemli
  collections: { type: [String], default: [] },      // “Turkish”, “Persian”, “Vintage”

  // SEO
  seo_title: { type: String, default: "" },
  seo_description: { type: String, default: "" },

  // Durum & moderasyon
  status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
  visibility: { type: String, enum: ["private", "public"], default: "private" },

  // Platform haritaları (opsiyonel cache)
  platform: {
    etsy: { listingId: String, shopSectionId: String, lastExportAt: Date },
    shopify: { productId: String, handle: String, lastExportAt: Date },
    gmc: { itemId: String, lastExportAt: Date },
    firstdibs: { listingId: String, lastExportAt: Date },
  },

}, { timestamps: true });

// Metin araması için TEK text index (Mongo’da sadece 1 tane olabilir)
ProductSchema.index({
  title: "text",
  description_html: "text",
  origin: "text",
  // tags: "text", // istersen açabilirsin
});

// Hızlı lookup’lar için ayrı normal index’ler:
// ProductSchema.index({ product_id: 1 }, { unique: true }); // Duplicate index kaldırıldı
ProductSchema.index({ updatedAt: -1 });
ProductSchema.pre("save", function(next) {
  // slug
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  // ensure one primary image
  if (Array.isArray(this.images) && this.images.length) {
    if (!this.images.some(i => i.isPrimary)) this.images[0].isPrimary = true;
  }
  next();
});

export default mongoose.model("Product", ProductSchema);
