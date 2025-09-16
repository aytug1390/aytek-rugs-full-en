Developer notes (dev only)

Environment (.env.local)

- NEXT_PUBLIC_ADMIN_API=/api/admin-api  # Next.js client proxy to internal API
- NEXTAUTH_URL=http://localhost:3000
- NEXTAUTH_SECRET=PASTE_SECRET_HERE
- MONGO_URI=mongodb://localhost:27017/aytekdb
- MONGO_DB=aytekdb
- PORT=5001

Running locally from repo root:

- npm run dev      # runs web (Next) and api (Express) via root package.json scripts

Notes:
- The Express API listens on PORT (5001) and is proxied by Next at /api/admin-api.
- If you change lockfiles or workspace topology, Next may warn about inferred workspace root; consider setting `outputFileTracingRoot` in next.config.js if necessary.
