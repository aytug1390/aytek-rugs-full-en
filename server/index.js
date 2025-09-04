


import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './db.js';
import Product from './models/Product.js';
import Category from './models/Category.js';

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

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => console.log(`[api] running on ${HOST}:${PORT}`));

export default app;

