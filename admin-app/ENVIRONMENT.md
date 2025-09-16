# Development environment for admin-app

1. Copy `env.example` to `.env.local` in `admin-app`:

```pwsh
cp env.example .env.local
# Fill real values in .env.local locally. Do NOT commit .env.local.
```

2. Start the app locally (example):

```pwsh
npm install
npm run dev
```

3. If `.env.local` is accidentally tracked, untrack it locally without deleting the file:

```pwsh
git rm --cached .env.local
git commit -m "chore: stop tracking .env.local"
```

4. Use `env.example` as the canonical template to share required variables with other developers.
