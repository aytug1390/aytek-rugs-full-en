# Admin App (minimal)

This folder contains a minimal Next.js app intended to host the admin UI on `:3001`.

Quickstart

1. Install dependencies:

```powershell
cd admin-app
npm ci
```

2. Run in dev mode:

```powershell
npm run dev
```

3. Build for production:

```powershell
npm run build
npm run start
```

Environment

- `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` — admin credentials.
- `ADMIN_CSRF_SECRET` — secret for signing CSRF tokens.
- `ADMIN_SESSION_SECRET` — secret for signing admin session tokens (if not set, falls back to `ADMIN_CSRF_SECRET`).
- `REDIS_URL` — optional Redis URL for rate limiting.

Notes

- This scaffold only contains the auth flow (login/logout/middleware). Migrate your admin pages into `app/admin` in this project when ready.

CI / Secrets

- In CI the `ADMIN_SECRET` is provided via the repository secret named `AYTEKRUGS`.
	- Do NOT commit the secret to source control.

- For local development, create `admin-app/.env.local` with:
	```
	ADMIN_SECRET=your-local-admin-secret
	```
	and do not commit that file.

- Security hygiene: rotate the secret periodically and limit access to the repository.
