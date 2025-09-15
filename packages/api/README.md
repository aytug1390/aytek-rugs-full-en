Packages/api - Local API helper

Quick steps to run locally:

1. Copy `.env.example` to `.env` and set `MONGO_URI`:

  - Atlas example:
    MONGO_URI=mongodb+srv://admin:PA55WORD@cluster0.mongodb.net/aytekdb?retryWrites=true&w=majority

  - Local Mongo example:
    MONGO_URI=mongodb://127.0.0.1:27017/aytekdb

2. Install deps and run dev server:

  cd packages/api
  npm install
  npm run dev

3. If using Mongo, create recommended indexes once the DB is reachable:

  node scripts/create_indexes.js

Notes:
- If you get `querySrv EBADNAME _mongodb._tcp.<cluster>` it means your `MONGO_URI` still contains a placeholder.
- For Atlas: replace `<cluster>` with the cluster host (e.g. cluster0) and whitelist your IP.
