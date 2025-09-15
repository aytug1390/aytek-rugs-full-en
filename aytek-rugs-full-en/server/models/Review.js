const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
  name: { type: String, required: true },
  email: { type: String },
  is_approved: { type: Boolean, default: false }, // Moderation
}, { timestamps: true });

ReviewSchema.index({ product_id: 1, createdAt: -1 });

module.exports = mongoose.model("Review", ReviewSchema);
