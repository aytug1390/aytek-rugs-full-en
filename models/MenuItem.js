import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  href: { type: String, required: true },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  roles: { type: [String], default: [] }, // empty array means visible to everyone
  menuVersion: { type: Number, default: 1 }
});

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
