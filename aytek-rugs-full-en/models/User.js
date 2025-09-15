import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String }, // for credentials auth
  roles: { type: [String], default: ['admin'] },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
