# Testing / Local verification

Follow these steps to run the prototype locally and exercise the quick-import and preview flows.

1. From the repository root (Windows PowerShell):

```pwsh
cd admin-app
npm install csv-parse zod
# optional types for editor: npm i -D @types/node
```

2. Start the dev server:

```pwsh
npm run dev
```

3. Browse to the Upload page:

- Open `http://localhost:3000/admin/admin/products/upload` (or the correct protected admin path in your setup).
- Pick a CSV and use the Preview/Import selected or Import all buttons.

4. Curl example (quick import all rows):

```pwsh
curl -X POST \
  -F "file=@./sample.csv;type=text/csv" \
  http://localhost:3000/api/admin-api/products/import
```

5. To import only particular product_ids via API, include a `selected` field with a JSON array of ids:

```pwsh
curl -X POST \
  -F "file=@./sample.csv;type=text/csv" \
  -F "selected=[\"10002\",\"10003\"]" \
  http://localhost:3000/api/admin-api/products/import
```

Troubleshooting

- If your editor shows missing Node types or `Buffer` errors, install `@types/node` dev types in `admin-app`:

```pwsh
cd admin-app
npm i -D @types/node
```

- If you haven't added runtime deps yet, install `csv-parse` and `zod`.

- For production use, replace file-backed store with a proper DB and add streaming/background processing for large CSVs.
