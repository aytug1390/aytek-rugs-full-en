# Aytek Rugs

Quick notes

- Migration: to create the MongoDB text index used by server-side $text search run:

```powershell
cd aytek-rugs-full-en
npm run migrate:create-text-index --silent
```

- CI runs on Node 20 and uses npm cache; migration is a manual DB operation and CI only performs a syntax check for the migration script.
