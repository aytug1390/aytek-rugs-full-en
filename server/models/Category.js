// ESM
import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    slug:        { type: String, required: true, unique: true, index: true },
    name:        { type: String, required: true },
    order:       { type: Number, default: 999 },
    active:      { type: Boolean, default: true },
    image:       { type: String, default: '' },   // 🔹 görsel URL
    description: { type: String, default: '' },   // 🔹 kısa açıklama (1 satır)
  },
  { timestamps: true }
);

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
