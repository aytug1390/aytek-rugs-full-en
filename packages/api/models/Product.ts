import { Schema, model } from "mongoose";

const ProductSchema = new Schema({
  product_id: { type: String, unique: true, index: true, required: true },
  title: { type: String, required: true },
  brand: { type: String, default: "Aytek Rugs" },
  price: Number,
  sale_price: Number,
  price_visible: { type: Boolean, default: true },
  category: { type: String, enum: ["rug","silver","other"], index: true },
  availability: { type: String, enum: ["in stock","out of stock","preorder"], default: "in stock" },
  material: String,
  color: [String],
  color_hex: [String],
  size_text: String,
  origin: String,
  age_group: String,
  pattern: String,
  images: [String],
  status: { type: String, enum:["active","draft","private"], default:"active", index:true },
  visibility: { type: String, enum:["public","unlisted","hidden"], default:"public" },
}, { timestamps: true });

ProductSchema.index({ title: "text", origin: "text", pattern: "text" });
// KOŞULLU VARSAYILANLAR: uygulama mantığı - model seviyesinde
ProductSchema.pre('validate', function (next) {
  // @ts-ignore
  const doc: any = this;

  // 1) category default to 'rug' when not provided
  if (!doc.category) {
    doc.category = 'rug';
  }

  // 2) price_visible default when not explicitly set
  if (typeof doc.price_visible === 'undefined') {
    doc.price_visible = doc.category === 'silver' ? true : false;
  }

  // 3) if category was changed to 'rug' during update and price_visible not provided,
  // ensure price_visible becomes false (protect updates that only change category)
  try {
    if (typeof (doc.isModified) === 'function' && doc.isModified('category')) {
      if (doc.category === 'rug' && typeof doc.price_visible === 'undefined') {
        doc.price_visible = false;
      }
    }
  } catch (e) {
    // no-op
  }

  next();
});

export default model("products", ProductSchema);
