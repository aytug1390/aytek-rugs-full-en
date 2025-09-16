
# Admin App – Dev Hızlı Başlangıç

## Çalıştırma
```powershell
cd C:\proje-aytek-rugs\admin-app
$env:ADMIN_SECRET='dev-secret'
npm run dev

# macOS/Linux
cd admin-app
ADMIN_SECRET=dev-secret npm run dev
```

Test

Ayrı bir terminalde:

```powershell
cd C:\proje-aytek-rugs\admin-app
$env:ADMIN_SECRET='dev-secret'
npm run test:admin
```

Beklenen:

No-cookie → 302 /admin/login

Invalid-cookie → 302 /admin/login

Valid-token → 200

Prod Notları

ADMIN_SECRET uzun ve rastgele olmalı (örn. openssl rand -hex 32).

HTTPS’de çalışırken cookie otomatik Secure olur (APP_URL https ise).

ADMIN_COOKIE_DOMAIN ile alan adını belirleyebilirsin (örn. .aytekrugs.com).

Nginx/CF arkasında X-Forwarded-Proto ve Host başlıklarını ilet.


---

## Hızlı komut özeti

```bash
# 1) cross-env kur
cd admin-app
npm i -D cross-env

# 2) dev sunucuyu başlat (demo)
npm run dev:demo

# 3) ayrı terminalde test
npm run test:admin:demo
```


