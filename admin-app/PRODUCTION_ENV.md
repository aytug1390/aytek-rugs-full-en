# Setting ADMIN_COOKIE_SECRET in production

Do NOT commit secrets into the repository. This file documents safe ways to add the `ADMIN_COOKIE_SECRET` environment variable to your production environment.

Replace `<SECRET>` below with your actual secret value before running any CLI commands. Do not store the secret in source control.

Quick checklist before you begin
- Verify you have permission to change environment variables on the target deployment (Vercel, Netlify, GC, Heroku, Azure, etc.)
- Rotate the secret immediately if it was ever committed or pushed to a remote previously.
- Prefer platform-managed secrets (Vercel project settings, GitHub Actions secrets, Netlify env vars) rather than embedding in CI logs or files.

Examples (PowerShell / Windows)

1) GitHub repository secrets (used by GitHub Actions)

```pwsh
# Requires: GitHub CLI (gh) and that you are authenticated
gh secret set ADMIN_COOKIE_SECRET --body '<SECRET>'
```

In GitHub Actions workflows, consume it like:

```yaml
env:
  ADMIN_COOKIE_SECRET: ${{ secrets.ADMIN_COOKIE_SECRET }}
```

2) Vercel (Dashboard)

- Go to your Vercel project -> Settings -> Environment Variables -> Add
- Name: `ADMIN_COOKIE_SECRET`, Value: `<SECRET>`, Environment: `Production`

Vercel CLI (interactive):

```pwsh
# interactive: will prompt for the value
vercel env add ADMIN_COOKIE_SECRET production
```

3) Netlify (CLI)

```pwsh
# Requires: netlify CLI and you are logged in
netlify env:set ADMIN_COOKIE_SECRET '<SECRET>'
```

4) Heroku

```pwsh
# Requires: heroku CLI and you are logged in
heroku config:set ADMIN_COOKIE_SECRET='<SECRET>' --app <your-heroku-app-name>
```

5) Azure App Service

```pwsh
# Requires: Azure CLI
az webapp config appsettings set --name <app-name> --resource-group <rg> --settings ADMIN_COOKIE_SECRET='<SECRET>'
```

6) Docker / Kubernetes / plain systemd

- For Docker Compose, set in your `docker-compose.yml` or pass via environment file that is not committed.
- For Kubernetes, create a secret and reference it in your Deployment:

```pwsh
kubectl create secret generic admin-cookie-secret --from-literal=ADMIN_COOKIE_SECRET='<SECRET>'
# Then mount or reference the secret in your Pod/Deployment manifest
```

Security reminders
- Do NOT put the secret in any committed file (no `.env` checked into Git).
- Limit access to the secret in your hosting platform (team permissions).
- Rotate the secret immediately if it was exposed (change the value and update prod and any dependent services).

If you want, I can prepare a one-shot PowerShell script to set a secret using `gh secret set` or `netlify env:set` — you would paste the secret into the script and run it locally. I will NOT store that secret anywhere in the repo.
