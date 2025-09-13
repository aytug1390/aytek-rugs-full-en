# Products CSV (Prototype)

**Header row required.** Supported columns (case-sensitive):
- `product_id` (required)
- `title`
- `price` (number)
- `origin`
- `size_text` (or `size`)
- `color` (comma separated, e.g. `Red,Blue`)
- `image_url`

Example:

```csv
product_id,title,price,origin,size,color,image_url
10002,Cappadocia Rug,299,Turkey,170x240,Beige,Burgundy,https://example.com/10002.jpg
10003,Cappadocia Rug,329,Turkey,170x240,Red,https://example.com/10003.jpg
```

Flow

Go to Admin → Products → Upload CSV.

Pick file → Preview → toggle rows → Import selected.

See import summary and verify in Products list.

This is a prototype: data is stored in `data/products.json`. For production use a real DB and a background job for large files.

Quick-import (one-click)

You can also use the one-click "Import all" flow from the Upload page which posts the CSV to the import endpoint and attempts to import every row without preview selection.

Local setup & testing

1. Install runtime/dev deps inside `admin-app` (you can run these from the repo root):

```pwsh
cd admin-app
npm install csv-parse zod
```

2. Start dev server:

```pwsh
npm run dev
```

3. Example curl to POST a CSV file to the import endpoint:

```pwsh
curl -X POST \
	-F "file=@./sample.csv;type=text/csv" \
	http://localhost:3000/api/admin-api/products/import
```

If you want to import only specific product_ids via API, include a `selected` form field with a JSON array of product ids:

```pwsh
curl -X POST \
	-F "file=@./sample.csv;type=text/csv" \
	-F "selected=[\"10002\",\"10003\"]" \
	http://localhost:3000/api/admin-api/products/import
```

Notes

- This prototype expects reasonable CSVs; the server does lightweight mapping (e.g. `color_code` -> `color`) and uses `zod` to validate rows before upserting into `data/products.json`.
- Install `@types/node` locally if your editor shows missing Node types: `npm i -D @types/node`.
