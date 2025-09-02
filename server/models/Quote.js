const mongoose = require("mongoose");

const QuoteSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  zip: String,
  service: String,
  rugSize: String,
  issue: String,
  message: String,
  photos: [String],
  utm: Object,
}, { timestamps: true });

module.exports = mongoose.model("Quote", QuoteSchema);
