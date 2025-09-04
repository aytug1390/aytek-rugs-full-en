import 'dotenv/config';
// Use the server's mongoose instance/connection so models share the same
// mongoose singleton and avoid buffering/timeout issues when running from
// the project root.
import mongoose from '../server/db.js';
import Product from '../server/models/Product.js';

const products = Array.from({ length: 400 }, (_, i) => ({
  product_id: 10000 + i,
  title: `Test Rug #${i + 1}`,
  price: 100 + i,
  collections: ['traditional-collection'],
  images: [],
  availability: 'in stock',
  material: 'Wool',
  size: '200x300',
  origin: 'Turkey',
}));

async function run() {
  // server/db.js already connects during import. Just run the operations
  await Product.deleteMany({});
  // Insert in batches to avoid huge single-op payloads
  const batchSize = 100;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    await Product.insertMany(batch);
  }
  const count = await Product.countDocuments();
  console.log(`✅ Seeded ${count} products.`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
