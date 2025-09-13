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
