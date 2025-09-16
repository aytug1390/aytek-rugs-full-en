let mongooseRef;
const MONGO_URI = process.env.MONGO_URI;

async function getMongoose() {
  if (!mongooseRef) {
    const mod = await import("mongoose");
    mongooseRef = mod.default || mod;
  }
  return mongooseRef;
}

async function getModel() {
  const mongoose = await getMongoose();
  const ReviewSchema = new mongoose.Schema({
    name: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now },
  });
  return mongoose.models.Review || mongoose.model("Review", ReviewSchema);
}

async function connect() {
  const mongoose = await getMongoose();
  if (mongoose.connection.readyState === 0) {
    if (!MONGO_URI) throw new Error("MONGO_URI not set");
    await mongoose.connect(MONGO_URI);
  }
}

export async function GET() {
  try {
    await connect();
  const Review = await getModel();
  const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    return new Response(JSON.stringify(reviews), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connect();
    const body = await req.json();
  const Review = await getModel();
  const doc = await Review.create(body);
    return new Response(JSON.stringify(doc), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
