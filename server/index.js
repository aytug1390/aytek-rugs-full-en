


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
		console.log('[admin-api] /admin-api/products request query ->', req.query);
		const { product_id, q, category } = req.query;
		const limit = Math.min(parseInt(req.query.limit || '24', 10), 100);
		const page = Math.max(parseInt(req.query.page || '1', 10), 1);

		const query = {};
		let sort = { _id: -1 };

			if (product_id) {
				// normalize accidental float-like product ids like "10005.0" -> "10005"
				let pid = String(product_id).trim();
				if (/^\d+\.0$/.test(pid)) pid = pid.replace(/\.0$/, '');
				query.product_id = pid;
			}

		if (q) {
			// text index varsa kullan; yoksa regex fallback de eklenebilir
			query.$text = { $search: q };
			sort = { score: { $meta: 'textScore' } };
		}
		// status / visibility filters: default to active/public unless caller overrides
		if (typeof req.query.status !== 'undefined' && req.query.status !== null) {
			query.status = String(req.query.status);
		} else {
			query.status = 'active';
		}
		if (typeof req.query.visibility !== 'undefined' && req.query.visibility !== null) {
			query.visibility = String(req.query.visibility);
		} else {
			query.visibility = 'public';
		}
		if (category) {
			// allow category to match pattern array, collections array, or title
			query.$or = [
				{ pattern: category },
				{ collections: category },
				{ title: { $regex: category, $options: 'i' } }
			];
		}
		// images filter: by default return only products that have at least one image
		// - explicit ?has_image=1 or ?has_image=true enforces the filter
		// - explicit ?has_image=0 or ?has_image=false will allow no-image products
		// - override default with ?include_no_image=1 to include no-image products in results
		if (typeof req.query.has_image !== 'undefined') {
			if (req.query.has_image === '1' || req.query.has_image === 'true') {
				query['images.0.url'] = { $exists: true, $ne: '' };
			}
		} else {
			if (!(req.query.include_no_image === '1' || req.query.include_no_image === 'true')) {
				query['images.0.url'] = { $exists: true, $ne: '' };
			}
		}

		// color filter: ?color=red or ?color=red,blue -> matches color_code array
		if (req.query.color) {
			const colors = String(req.query.color).split(',').map(s => s.trim()).filter(Boolean);
			if (colors.length) query.color_code = { $in: colors };
		}

		// origin filter: ?origin=Turkey or ?origin=Turkey,Persia -> matches origin_country
		if (req.query.origin) {
			const origins = String(req.query.origin).split(',').map(s => s.trim()).filter(Boolean);
			if (origins.length) query.origin_country = { $in: origins };
		}

		// numeric size range filters (cm): ?min_width=180&max_width=200
		const minW = req.query.min_width ? Number(req.query.min_width) : null;
		const maxW = req.query.max_width ? Number(req.query.max_width) : null;
		const minH = req.query.min_height ? Number(req.query.min_height) : null;
		const maxH = req.query.max_height ? Number(req.query.max_height) : null;
		if (minW != null || maxW != null) {
			query.width_cm = query.width_cm || {};
			if (minW != null && Number.isFinite(minW)) query.width_cm.$gte = minW;
			if (maxW != null && Number.isFinite(maxW)) query.width_cm.$lte = maxW;
		}
		if (minH != null || maxH != null) {
			query.height_cm = query.height_cm || {};
			if (minH != null && Number.isFinite(minH)) query.height_cm.$gte = minH;
			if (maxH != null && Number.isFinite(maxH)) query.height_cm.$lte = maxH;
		}

		const cursor = Product.find(query).sort(sort).skip((page - 1) * limit).limit(limit);
		if (q) cursor.select({ score: { $meta: 'textScore' } });

		// If caller only wants the total count for this filter, return it quickly.
		if (req.query.count_only === '1' || req.query.count_only === 'true') {
			// compute a few related counts for debugging so callers can see which filter matches
			const total = await Product.countDocuments(query);
			const images0 = await Product.countDocuments({ 'images.0.url': { $exists: true, $ne: '' }, ...query }).catch(()=>null);
			const imagesAny = await Product.countDocuments({ 'images.url': { $exists: true, $ne: '' }, ...query }).catch(()=>null);
			const mainImage = await Product.countDocuments({ main_image: { $exists: true, $ne: '' }, ...query }).catch(()=>null);
			return res.json({
				total,
				page,
				pageSize: 0,
				items: [],
				_debug: {
					query,
					counts: { images0, imagesAny, mainImage }
				}
			});
		}

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

