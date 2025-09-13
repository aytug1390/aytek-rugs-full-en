# Admin Products — CSV format

Kısa CSV örneği (başlık satırı zorunlu):

id,sku,name,price,description,image
,SKU1234,El Dokuması Halı,249.99,Size özel el dokuma halı,http://example.com/img1.jpg

- `id` boş bırakılırsa import sırasında yeni id atanır.
- `sku`, `name`, `price` önerilir. `image` alanı ürün resim URL'si içerir.

Import workflow

1. Admin > Products > CSV Upload sayfasından CSV seçilir.
2. Preview görüntülenir.
3. Upload ile CSV sunucuya gönderilir ve `admin-app/data/products.json` içinde saklanır (prototype).

Uyarı: Bu prototype file-backed store kullanır. Prod için DB (Postgres / Mongo) gerekli.
