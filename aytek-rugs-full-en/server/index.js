


import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import express from 'express';
import util from 'node:util';
import cors from 'cors';

// Delay database and model imports until after dotenv.config() has run.
// Static imports are hoisted by ESM and would execute before dotenv runs,
// which causes required env vars (MONGO_URI) to be missing.
let Product, Category;
await import('./db.js');
Product = (await import('./models/Product.js')).default;
Category = (await import('./models/Category.js')).default;

const app = express();
// Expose custom headers so browsers can read them via response.headers.get()
app.use(cors({ exposedHeaders: ['x-search-used', 'x-search-mode', 'x-applied-filters'] }));
app.use(express.json());

// Ensure custom debug headers are exposed to clients and tools.
// Although `cors({ exposedHeaders })` is configured above, explicitly setting
// `Access-Control-Expose-Headers` on every response guarantees that proxies or
// hosting layers which might not respect the cors middleware still receive it.
app.use((req, res, next) => {
	// Ensure our debug header is exposed to clients
	res.setHeader('Access-Control-Expose-Headers', 'x-search-used,x-search-mode,x-applied-filters');
	next();
});

// Sağlık kontrolü
app.get('/admin-api/_health', (req, res) => res.json({ ok: true }));

// Dev-only debug: return a few products that match 'brown' in color fields
if (process.env.NODE_ENV !== 'production') {
	app.get('/admin-api/_debug/brown', async (req, res) => {
		try {
			const docs = await Product.find({ $or:[{ color_names: /brown/i }, { color_hex: /7b4f2a/i }, { color: /brown/i }] }).limit(10).select('product_id color_names color_hex color images').lean().exec();
			return res.json({ count: docs.length, sample: docs });
		} catch (e) {
			console.error('debug/brown error', e);
			return res.status(500).json({ error: 'debug_failed' });
		}
	});
}

// LIST: /admin-api/products?limit=24&page=1&q=Kilim&product_id=XYZ
app.get('/admin-api/products', async (req, res) => {
	try {
		// Keep defaults for header visibility
		res.setHeader('x-search-used', 'none');
		res.setHeader('x-search-mode', (req.headers['x-search-mode'] || 'none').toString());

		// Build a clean filter using the provided helper logic. Use an AND list so
		// multiple independent constraints are combined (e.g. has_image AND color).
		function buildFilter(q) {
			const ands = [];
			if (q.product_id) {
				ands.push({ product_id: String(q.product_id) });
			}
			if (q.status) ands.push({ status: String(q.status) });
			if (q.visibility) ands.push({ visibility: String(q.visibility) });

			// width filters (min/max) may be passed from frontend to narrow images.
			// These should map to the product's numeric `width_cm` field so
			// comparisons are efficient and unambiguous.
			if (q.min_width || q.max_width) {
				const sub = {};
				const wc = {};
				if (q.min_width) wc.$gte = parseInt(q.min_width, 10);
				if (q.max_width) wc.$lte = parseInt(q.max_width, 10);
				sub.width_cm = wc;
				ands.push(sub);
			}

			// has_image: exclude common placeholder values
			if (q.has_image === '1' || q.has_image === 'true') {
				const notPlaceholder = { $nin: [null, '', 'https://via.placeholder.com/800x600?text=No+Image', 'https://via.placeholder.com/400x300?text=No+Image', '/placeholder.jpg'] };
				// Accept images stored as a non-empty array (images.0 exists) in addition to
				// image_url / images.url checks. Some products have images recorded as an
				// array without a nested 'url' field or with different shapes; checking
				// 'images.0' avoids excluding those.
				ands.push({ $or: [
					{ image_url: { $exists: true, ...notPlaceholder } },
					{ 'images.url': { $exists: true, ...notPlaceholder } },
					{ 'images.0': { $exists: true } },
					{ has_image: true }
				]});
			}

			if (q.color) {
				// Allow substring (case-insensitive) matching for user-friendly filtering.
				// Escape special regex chars from input to avoid injection, but do not
				// anchor the pattern so a search like `red` will also match `red-white`.
				const esc = String(q.color).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
				const regexObj = { $regex: esc, $options: 'i' };
				const elemRegex = { $elemMatch: { $regex: esc, $options: 'i' } };
				// match color string or array-of-strings
				ands.push({ $or: [ { color: regexObj }, { colors: regexObj }, { color: elemRegex } ] });
			}

			if (q.size) {
				// Normalize common dash characters (EN DASH, EM DASH, minus sign) to ASCII hyphen
				// because UIs sometimes produce different dash glyphs which the regex won't match.
				const raw = String(q.size || '').trim();
				const s = raw.replace(/[–—−]/g, '-');
				if (s) {
					// If numeric width filters were explicitly provided, prefer those and
					// treat `size` as a display-only value. This avoids accidentally
					// adding a textual regex that conflicts with numeric constraints.
					if (q.min_width || q.max_width) {
						// do not add any DB constraint for `size` when numeric min/max are present
					} else {
						const rangeRegex = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/g;
						let m;
						const ranges = [];
						while ((m = rangeRegex.exec(s)) !== null) {
							ranges.push([parseFloat(m[1]), parseFloat(m[2])]);
						}
						if (ranges.length) {
							const ors = [];
							for (const [minF, maxF] of ranges) {
								ors.push({ $expr: { $and: [ { $gte: [ { $divide: ["$width_cm", 30.48] }, minF ] }, { $lte: [ { $divide: ["$width_cm", 30.48] }, maxF ] } ] } });
								ors.push({ $expr: { $and: [ { $gte: [ { $divide: ["$height_cm", 30.48] }, minF ] }, { $lte: [ { $divide: ["$height_cm", 30.48] }, maxF ] } ] } });
							}
							ands.push({ $or: ors });
						} else {
							// Only fall back to textual size_text matches for non-numeric
							// size strings (e.g. "6'4\" x 9'5\""). If `size` looks like
							// only numbers/dashes but didn't match the range parser, ignore
							// it to avoid producing a no-op regex that removes results.
							const looksLikeTextual = /[a-zA-Z"'x×]/.test(s);
							if (looksLikeTextual) {
								const esc = s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
								ands.push({ size_text: { $regex: `^${esc}$`, $options: 'i' } });
							}
						}
					}
				}
			}

			if (q.origin) {
				const o = String(q.origin).trim();
				if (o) {
					const esc = o.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
					const rxObj = { $regex: `^${esc}$`, $options: 'i' };
					ands.push({ $or: [ { origin: rxObj }, { origin_country: rxObj } ] });
				}
			}

			if (ands.length === 0) return {};
			if (ands.length === 1) return ands[0];
			return { $and: ands };
		}

		// Normalize product shape so list and single endpoints present the same
		// canonical keys to callers (size_text, color_hex, color_code, origin_country,
		// images[], has_image, image_url, etc.). This mirrors the proxy normalizer
		// used by the Next.js single-item proxy.
		function normalizeProduct(raw) {
			if (!raw || typeof raw !== 'object') return null;
			let images = [];
			if (Array.isArray(raw.images)) images = raw.images;
			else if (Array.isArray(raw.photos)) images = raw.photos;
			else if (Array.isArray(raw.media?.images)) images = raw.media.images;
			else if (raw.image_url) images = [{ url: raw.image_url, alt: raw.image_alt ?? raw.image_caption ?? '' }];
			else if (Array.isArray(raw.image_urls)) images = raw.image_urls.map(u => (typeof u === 'string' ? { url: u } : u));

			const color = Array.isArray(raw.color) ? raw.color.map(c => String(c)) : raw.color ? [String(raw.color)] : [];
			const color_hex = Array.isArray(raw.color_hex) ? raw.color_hex.map(c => String(c)) : raw.color_hex ? [String(raw.color_hex)] : [];
			const color_code = Array.isArray(raw.color_code) ? raw.color_code.map(c => String(c)) : raw.color_code ? [String(raw.color_code)] : [];

			return {
				_id: String(raw._id ?? raw.id ?? ""),
				product_id: String(raw.product_id ?? raw.id ?? ""),
				title: String(raw.title ?? raw.name ?? ""),
				availability: String(raw.availability ?? raw.status ?? ""),
				price: raw.price ?? null,
				sale_price: raw.sale_price ?? null,
				description_html: String(raw.description_html ?? raw.description ?? ""),
				images: images.map((img, i) => ({ url: String(img?.url ?? img?.src ?? img ?? ""), alt: String(img?.alt ?? img?.caption ?? img?.alt_text ?? `Image ${i+1}`), isPrimary: Boolean(img?.isPrimary ?? img?.primary ?? i === 0) })),
				color,
				color_hex,
				color_names: Array.isArray(raw.color_names) ? raw.color_names : [],
				color_code,
				size_text: raw.size_text ?? raw.sizeText ?? raw.size ?? null,
				has_image: Boolean(raw.has_image ?? raw.hasImage ?? (Array.isArray(images) && images.length > 0) ?? false),
				image_url: String(raw.image_url ?? raw.imageUrl ?? raw.image ?? (images[0]?.url) ?? ""),
				collections: Array.isArray(raw.collections) ? raw.collections : raw.collections ? [raw.collections] : [],
				tags: Array.isArray(raw.tags) ? raw.tags : raw.tags ? [raw.tags] : [],
				brand: raw.brand ?? null,
				origin_country: raw.origin_country ?? raw.origin ?? null,
				height_cm: raw.height_cm ?? raw.height ?? null,
				width_cm: raw.width_cm ?? raw.width ?? null,
				slug: raw.slug ?? null,
				status: raw.status ?? null,
				visibility: raw.visibility ?? null,
				createdAt: raw.createdAt ?? null,
				updatedAt: raw.updatedAt ?? null,
			};
		}

		const q = req.query;
		const rawQ = q;

		// Helper: build a filter from query params but without any color constraint
		function buildFilterNoColorFromRaw(qno) {
			const ands = [];
			if (qno.product_id) ands.push({ product_id: String(qno.product_id) });
			if (qno.status) ands.push({ status: String(qno.status) });
			if (qno.visibility) ands.push({ visibility: String(qno.visibility) });
			if (qno.min_width || qno.max_width) {
				const sub = {};
				const wc = {};
				if (qno.min_width) wc.$gte = parseInt(qno.min_width, 10);
				if (qno.max_width) wc.$lte = parseInt(qno.max_width, 10);
				sub.width_cm = wc;
				ands.push(sub);
			}
			if (qno.size) {
				const raw = String(qno.size || '').trim();
				const s = raw.replace(/[–—−]/g, '-');
				if (s) {
					if (qno.min_width || qno.max_width) {
						// numeric filters present: ignore textual `size` for DB filtering
					} else {
						const rangeRegex = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/g;
						let m;
						const ranges = [];
						while ((m = rangeRegex.exec(s)) !== null) {
							ranges.push([parseFloat(m[1]), parseFloat(m[2])]);
						}
						if (ranges.length) {
							const ors = [];
							for (const [minF, maxF] of ranges) {
								ors.push({ $expr: { $and: [ { $gte: [ { $divide: ["$width_cm", 30.48] }, minF ] }, { $lte: [ { $divide: ["$width_cm", 30.48] }, maxF ] } ] } });
								ors.push({ $expr: { $and: [ { $gte: [ { $divide: ["$height_cm", 30.48] }, minF ] }, { $lte: [ { $divide: ["$height_cm", 30.48] }, maxF ] } ] } });
							}
							ands.push({ $or: ors });
						} else {
							const looksLikeTextual = /[a-zA-Z"'x×]/.test(s);
							if (looksLikeTextual) {
								const esc = s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
								ands.push({ size_text: { $regex: `^${esc}$`, $options: 'i' } });
							}
						}
					}
				}
			}
			if (qno.origin) {
				const o = String(qno.origin).trim();
				if (o) {
					const esc = o.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
					const rxObj = { $regex: `^${esc}$`, $options: 'i' };
					ands.push({ $or: [ { origin: rxObj }, { origin_country: rxObj } ] });
				}
			}
			if (ands.length === 0) return {};
			if (ands.length === 1) return ands[0];
			return { $and: ands };
		}
		// We'll support two color filter modes:
		// - If the user supplies a hex code (e.g. #ff0000 or ff0000), use DB-side regex matching.
		// - If the user supplies a text color (e.g. "red"), perform an in-memory mapping of
		//   product color hexes to simple color names and filter in JS. This avoids complex
		//   and error-prone regex/lookup in Mongo and provides flexible substring matching.

		function hexToRgb(hex) {
			if (!hex) return null;
			const h = String(hex).replace(/^#/, '').trim();
			if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return null;
			let r, g, b;
			if (h.length === 3) {
				r = parseInt(h[0] + h[0], 16);
				g = parseInt(h[1] + h[1], 16);
				b = parseInt(h[2] + h[2], 16);
			} else {
				r = parseInt(h.slice(0,2), 16);
				g = parseInt(h.slice(2,4), 16);
				b = parseInt(h.slice(4,6), 16);
			}
			return { r, g, b };
		}

		function rgbToHsv(r, g, b) {
			r /= 255; g /= 255; b /= 255;
			const max = Math.max(r,g,b), min = Math.min(r,g,b);
			const d = max - min;
			let h = 0;
			if (d === 0) h = 0;
			else if (max === r) h = ((g - b) / d) % 6;
			else if (max === g) h = (b - r) / d + 2;
			else h = (r - g) / d + 4;
			h = Math.round(h * 60);
			if (h < 0) h += 360;
			const s = max === 0 ? 0 : d / max;
			const v = max;
			return { h, s, v };
		}

		function basicColorNameFromHex(hex) {
			const rgb = hexToRgb(hex);
			if (!rgb) return '';
			const { h, s, v } = rgbToHsv(rgb.r, rgb.g, rgb.b);
			// Black / white / gray thresholds
			if (v <= 0.12) return 'black';
			if (v >= 0.94 && s <= 0.12) return 'white';
			if (s <= 0.15 && v >= 0.12 && v <= 0.94) return 'gray';
			// Hue-based buckets (approximate)
			if ((h >= 330 && h <= 360) || (h >= 0 && h <= 15)) return 'red';
			if (h > 15 && h <= 40) return 'orange';
			if (h > 40 && h <= 65) return 'yellow';
			if (h > 65 && h <= 170) return 'green';
			if (h > 170 && h <= 200) return 'cyan';
			if (h > 200 && h <= 260) return 'blue';
			if (h > 260 && h <= 295) return 'purple';
			if (h > 295 && h <= 330) return 'pink';
			// Fallback for low-sat warm neutrals -> call 'brown' or 'beige'
			if (h > 15 && h <= 55 && s <= 0.55 && v <= 0.85) return 'brown';
			// Default fallback return empty string
			return '';
		}

		// Reference palette for distance-based matching (same as migration script)
		// Expanded to include common primary/secondary/neutral buckets so textual
		// color queries like `red`, `blue`, `black` can be mapped to hex values.
		const referenceColors = {
			red: '#ff0000',
			maroon: '#800000',
			burgundy: '#800020',
			orange: '#ff7f00',
			amber: '#ffbf00',
			yellow: '#ffff00',
			gold: '#d4af37',
			lime: '#bfff00',
			green: '#00a14b',
			olive: '#808000',
			teal: '#008080',
			turquoise: '#30d5c8',
			cyan: '#00b7c7',
			blue: '#0047ab',
			navy: '#000080',
			purple: '#7b26b5',
			violet: '#8b00ff',
			pink: '#ff66a3',
			magenta: '#ff00ff',
			brown: '#7b4f2a',
			beige: '#d6c4a2',
			cream: '#fff5d7',
			black: '#000000',
			white: '#ffffff',
			gray: '#808080',
			silver: '#c0c0c0'
		};
		function rgbDistSq(a, b) {
			const dr = a.r - b.r;
			const dg = a.g - b.g;
			const db = a.b - b.b;
			return dr*dr + dg*dg + db*db;
		}
		function hexIsNear(hex, targetHex, maxSq) {
			const r1 = hexToRgb(hex);
			const r2 = hexToRgb(targetHex);
			if (!r1 || !r2) return false;
			return rgbDistSq(r1, r2) <= maxSq;
		}

		const filter = buildFilter(q);

		// Expose a minimal applied-filters header early (useful for count-only checks)
		try {
			res.setHeader('x-applied-filters', JSON.stringify({ filter: serializeFilter(filter) }));
		} catch (e) {
			// ignore header failures
		}
	let colorQueryIsHex = false;
		let colorQueryRaw = (rawQ.color || '').toString().trim();
		// small Turkish->English alias map to support users typing common Turkish
		// color names (e.g. 'kirmizi') while the color-name buckets are English.
		// Values are arrays to allow mapping a single Turkish word to multiple
		// candidate English buckets for more forgiving developer-mode matching.
		// English-only alias map: map some common English synonyms to canonical buckets.
		// This intentionally excludes Turkish keywords — the frontend should supply
		// English color names for queries.
		const englishColorAliases = {
			'burgundy': ['maroon','red'],
			'maroon': ['red'],
			'cream': ['beige'],
			'khaki': ['beige','brown'],
			'navy': ['blue'],
			'silver': ['gray','silver'],
			'turquoise': ['teal','cyan'],
			'lightblue': ['blue']
		};
		const aliasEnglishList = englishColorAliases[colorQueryRaw.toLowerCase()] || [];
		if (colorQueryRaw) {
			// determine if input looks like a hex color
			const maybe = colorQueryRaw.replace(/^#/, '');
			if (/^[0-9a-fA-F]{3}$/.test(maybe) || /^[0-9a-fA-F]{6}$/.test(maybe)) {
				colorQueryIsHex = true;
				// ensure DB filter will match hex-like strings
				const esc = String(colorQueryRaw).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
				const rx = new RegExp(esc, 'i');
				// extend filter with hex matching against color_hex or color
				if (!filter.$and) filter.$and = [];
				filter.$and.push({ $or: [ { color_hex: rx }, { color: rx } ] });
			} else {
				// textual color: perform DB-side matching against `color_names` and
				// include any Turkish alias targets to broaden matches. This avoids
				// in-memory paging complexity and ensures the DB returns full items.
				const esc = String(colorQueryRaw).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
				// use plain-object regex specs (pattern + options) so debug JSON is readable
				const pat = esc;
				const regexObj = { $regex: pat, $options: 'i' };
				const elemRegex = { $elemMatch: { $regex: pat, $options: 'i' } };
				// Build matchers to cover the common shapes we store products in:
				const ors = [];
				// color_names: array of strings
				ors.push({ color_names: elemRegex });
				// color can be string or array of strings
				ors.push({ color: regexObj });
				ors.push({ color: elemRegex });
				// hex/code fields
				ors.push({ color_hex: regexObj });
				ors.push({ color_code: regexObj });
				// color array of objects with name/code
				ors.push({ 'color.name': regexObj });
				ors.push({ 'color.code': regexObj });

				// If `buildFilter` previously added a simple `$or` entry focused on
				// `color`/`colors`, remove it whether it's stored as a top-level
				// `filter.$or` or as an `$or` child inside `filter.$and`. Leaving both
				// would require both ORs to match (they'd be combined by $and),
				// which often yields zero results when color names live in
				// `color_names` instead of `color`/`colors`.
				function isSimpleColorOrNode(node) {
					if (!node || typeof node !== 'object') return false;
					const keys = Object.keys(node);
					if (keys.length !== 1) return false;
					if (!node.$or || !Array.isArray(node.$or)) return false;
					// Each child should be a single-key object whose key is 'color' or 'colors'
					return node.$or.every(it => {
						if (!it || typeof it !== 'object') return false;
						const ks = Object.keys(it);
						if (ks.length !== 1) return false;
						return ks[0] === 'color' || ks[0] === 'colors';
					});
				}
				if (filter.$or && Array.isArray(filter.$or)) {
					filter.$or = filter.$or.filter(it => !isSimpleColorOrNode(it));
					if (filter.$or.length === 0) delete filter.$or;
				}
				if (filter.$and && Array.isArray(filter.$and)) {
					filter.$and = filter.$and.filter(it => !isSimpleColorOrNode(it));
					if (filter.$and.length === 0) delete filter.$and;
				}

				if (aliasEnglishList.length) {
					for (const a of aliasEnglishList) {
						if (!a) continue;
						const ap = String(a).replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');
						const aRegexObj = { $regex: ap, $options: 'i' };
						const aElem = { $elemMatch: { $regex: ap, $options: 'i' } };
						ors.push({ color_names: aElem });
						ors.push({ color: aRegexObj });
						ors.push({ color_hex: aRegexObj });
						ors.push({ 'color.name': aRegexObj });
						ors.push({ 'color.code': aRegexObj });
					}
				}
				if (!filter.$and) filter.$and = [];
				filter.$and.push({ $or: ors });
			}
		}

		// Debug: return the computed filter when debug=1 (only outside production)
		// Helper to convert RegExp instances into string form for JSON debug output
		function serializeFilter(obj) {
			if (obj instanceof RegExp) return obj.toString();
			if (Array.isArray(obj)) return obj.map(serializeFilter);
			if (obj && typeof obj === 'object') {
				const out = {};
				for (const k of Object.keys(obj)) out[k] = serializeFilter(obj[k]);
				return out;
			}
			return obj;
		}
		if (process.env.NODE_ENV !== 'production' && String(q.debug || '').trim() === '1') {
			try {
				res.setHeader('x-applied-filters', JSON.stringify({ filter: serializeFilter(filter) }));
			} catch (e) {}
			console.log('[api] debug filter:', JSON.stringify(serializeFilter(filter)));
			return res.json({ filter: serializeFilter(filter), query: q });
		}

		const limit = Math.max(1, Math.min(parseInt(q.limit || '24', 10), 100));
		const page = Math.max(1, parseInt(q.page || '1', 10));
		const skip = (page - 1) * limit;

		// Build an explicit appliedFilters object for debugging and headers.
		const appliedFilters = { page, limit };
		// If numeric width filters were provided, map them to width_cm for clarity
		if (q.min_width || q.max_width) {
			appliedFilters.width_cm = {};
			if (q.min_width) appliedFilters.width_cm.$gte = parseInt(q.min_width, 10);
			if (q.max_width) appliedFilters.width_cm.$lte = parseInt(q.max_width, 10);
		}
		if (q.size) appliedFilters.displaySize = String(q.size);

		try {
			res.setHeader('x-applied-filters', JSON.stringify(appliedFilters));
			console.log('[api] applied filters:', JSON.stringify(appliedFilters));
		} catch (e) { /* ignore header/log failures */ }

	// If only a count is requested, return minimal JSON
		// If only a count is requested, return minimal JSON. However, when we're
		// set to do in-memory textual color filtering we must not call
		// Product.countDocuments(filter) because `filter` may still contain a
		// color regex that was intentionally removed into `filter._noColor`.
		if (q.count_only === '1' || q.count_only === 'true') {
			const total = await Product.countDocuments(filter).exec();
			return res.json({ total });
		}

				// If we need to do in-memory color-name filtering, fetch candidates using
		// the filter without color constraints (computed earlier as filter._noColor).

				// Dev-only: expose textual inspection of the filter so regexes are visible
				if (process.env.NODE_ENV !== 'production' && String(q.debug || '').trim() === '3') {
					return res.json({ filterText: util.inspect(filter, { depth: null }) });
				}
	let total;
	let rawItems;
	let __debug_meta = null;
		[total, rawItems] = await Promise.all([
					Product.countDocuments(filter).exec(),
					Product.find(filter).skip(skip).limit(limit).lean().exec()
				]);
			try {
				console.log(`[api] DB path: total=${total}, rawItemsLen=${Array.isArray(rawItems)?rawItems.length:typeof rawItems}`);
				if (total > 0 && Array.isArray(rawItems) && rawItems.length === 0) {
					const sample = await Product.find(filter).limit(5).select('product_id _id color_names color_hex color').lean().exec();
					console.log('[api] DB sample fetch count=', sample.length, 'ids=', sample.map(s=>s.product_id||String(s._id)).slice(0,10));
				}
			} catch(e) { console.error('[api] debug sample fetch failed', e); }

				// Normalize each item so list consumers see the same canonical keys as
				// the single-item proxy's normalizeProduct.
				try {
					console.log('[api] rawItems length=', Array.isArray(rawItems) ? rawItems.length : typeof rawItems);
					if (Array.isArray(rawItems) && rawItems.length) console.log('[api] rawItems[0] keys=', Object.keys(rawItems[0] || {}).slice(0,20));
				} catch (e) {}
			let items = Array.isArray(rawItems) ? rawItems.map(i => normalizeProduct(i)).filter(Boolean) : [];
			try { console.log('[api] items after normalize length=', items.length); } catch (e) {}
			// capture normalized items before color-name filtering for debug
			const _itemsBeforeColorFilter = Array.isArray(items) ? items.map(i=>i) : [];

			// Enrich each normalized item by deriving textual color names from any
			// available hex codes. This ensures products that only store hex values
			// still surface friendly color names in `color_names` and `color`.
			function deriveNamesFromHexes(hexs) {
				if (!Array.isArray(hexs)) return [];
				const out = new Set();
				for (const hraw of hexs) {
					if (!hraw) continue;
					const h = String(hraw).replace(/^#/, '').trim();
					// try basic HSV-based bucket first
					const basic = basicColorNameFromHex(h);
					if (basic) { out.add(basic); continue; }
					// fallback: find nearest reference color by RGB distance
					const rgb = hexToRgb(h);
					if (!rgb) continue;
					let best = null;
					let bestDist = Infinity;
					for (const [name, refHex] of Object.entries(referenceColors)) {
						const refRgb = hexToRgb(refHex);
						if (!refRgb) continue;
						const d = rgbDistSq(rgb, refRgb);
						if (d < bestDist) { bestDist = d; best = name; }
					}
					// Accept the nearest reference if it's reasonably close
					if (best && bestDist <= 10000) out.add(best);
				}
				return Array.from(out);
			}

			// Merge derived names into each item
			if (Array.isArray(items) && items.length) {
				for (const it of items) {
					try {
						const existingNames = Array.isArray(it.color_names) ? new Set(it.color_names.map(s => String(s).toLowerCase())) : new Set();
						const existingColors = Array.isArray(it.color) ? new Set(it.color.map(s => String(s).toLowerCase())) : new Set();
						const derived = deriveNamesFromHexes(it.color_hex || []);
						for (const d of derived) {
							existingNames.add(String(d).toLowerCase());
							existingColors.add(String(d).toLowerCase());
						}
						// Write back standardized arrays (capitalize none; keep lower-case for consistency)
						it.color_names = Array.from(existingNames).map(s => String(s));
						it.color = Array.from(existingColors).map(s => String(s));
					} catch (e) {
						console.error('[api] color hex -> name mapping failed for item', it && it.product_id, e);
					}
				}
			}

		// For developer inspection include the normalized items before/after
		if (process.env.NODE_ENV !== 'production' && String(q.debug || '').trim() === '2') {
			return res.json({ total, page, pageSize: limit, items, normalizedBeforeFilter: _itemsBeforeColorFilter, normalizedAfterFilter: items });
		}
				res.json({ total, page, pageSize: limit, items });
	} catch (err) {
		console.error('GET /admin-api/products error:', err);
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
// Listen on all interfaces by default to match how the dev proxy expects to
// reach the API (and to mirror earlier log lines that reported 0.0.0.0).
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => console.log(`[api] running on ${HOST}:${PORT}`));

// Graceful logging and shutdown handlers so runtime errors are visible and the
// process can be terminated cleanly by dev tools / CI.
process.on('uncaughtException', (err) => {
	console.error('[api] Uncaught exception:', err);
	// In dev we don't crash immediately to allow log inspection; in production
	// you might want to exit(1).
});
process.on('unhandledRejection', (reason) => {
	console.error('[api] Unhandled rejection:', reason);
});
process.on('SIGTERM', () => {
	console.log('[api] SIGTERM received — shutting down server');
	server.close(() => process.exit(0));
});

export default app;

