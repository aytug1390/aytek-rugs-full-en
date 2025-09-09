


import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import express from 'express';
import cors from 'cors';

// Delay database and model imports until after dotenv.config() has run.
// Static imports are hoisted by ESM and would execute before dotenv runs,
// which causes required env vars (MONGO_URI) to be missing.
let Product, Category;
await import('./db.js');
Product = (await import('./models/Product.js')).default;
Category = (await import('./models/Category.js')).default;

const app = express();
app.use(cors());
app.use(express.json());

// Sağlık kontrolü
app.get('/admin-api/_health', (req, res) => res.json({ ok: true }));

// LIST: /admin-api/products?limit=24&page=1&q=Kilim&product_id=XYZ
app.get('/admin-api/products', async (req, res) => {
	try {
		const { product_id, q, category } = req.query;
		const limit = Math.min(parseInt(req.query.limit || '24', 10), 100);
		const page = Math.max(parseInt(req.query.page || '1', 10), 1);

		const query = {};
		let sort = { _id: -1 };

		if (product_id) query.product_id = product_id;

		if (q) {
			// text index varsa kullan; yoksa regex fallback de eklenebilir
			query.$text = { $search: q };
			sort = { score: { $meta: 'textScore' } };
		}
		if (category) {
			// allow category to match pattern array, collections array, or title
			query.$or = [
				{ pattern: category },
				{ collections: category },
				{ title: { $regex: category, $options: 'i' } }
			];
		}

		const cursor = Product.find(query).sort(sort).skip((page - 1) * limit).limit(limit);
		if (q) cursor.select({ score: { $meta: 'textScore' } });

		const [items, total] = await Promise.all([
			cursor,
			Product.countDocuments(query)
		]);

		res.json({ items, total, page, pageSize: limit });
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: 'server_error' });
	}
});

// LIST: /admin-api/categories
app.get('/admin-api/categories', async (req, res) => {
	try {
		const items = await Category.find({ active: true })
			.select('slug name order image description')
			.sort({ order: 1, name: 1 })
			.lean()
			.exec();
		res.json({ items });
	} catch (err) {
		console.error('GET /admin-api/categories error:', err);
		res.status(500).json({ error: 'categories_failed' });
	}
});

// SINGLE: /admin-api/products/:id
app.get('/admin-api/products/:id', async (req, res) => {
	try {
		const { id } = req.params;
		// Prefer lookup by product_id (string IDs like "16600").
		// Only attempt _id lookup when the id is a valid 24-char hex string (ObjectId).
		let item = await Product.findOne({ product_id: id }).lean().exec();
		if (!item && /^[0-9a-fA-F]{24}$/.test(id)) {
			item = await Product.findOne({ _id: id }).lean().exec();
		}
		if (!item) return res.status(404).json({ error: 'not_found' });
		// Return the product object directly (client/next proxy will normalize as needed)
		res.json(item);
	} catch (err) {
		console.error('GET /admin-api/products/:id error:', err);
		res.status(500).json({ error: 'server_error' });
	}
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => console.log(`[api] running on ${HOST}:${PORT}`));

export default app;

