Summary
-------
This branch (proxy-img-ui-fixes) contains small UI and infra changes to centralize image proxy usage and prevent overlays from blocking clicks.

What I changed
--------------
- Navbar components updated to `sticky top-0 z-50` with a translucent backdrop blur so they sit above loading overlays.
  - `aytek-rugs-full-en/src/components/Navbar.jsx`
  - `aytek-rugs-full-en/app/components/NavbarClient.jsx`

- Product cards constrained to be `relative` so any `absolute inset-0` overlay is contained within the card.
  - `aytek-rugs-full-en/src/components/ProductCard.tsx`

- Global CSS rule added to prevent loading overlays from blocking clicks:
  - `styles/globals.css`
  - `aytek-rugs-full-en/styles/globals.css`
  - Added: `.loading-overlay { pointer-events: none; }`

- CI: Added GitHub Actions lint matrix to run ESLint for both apps (aytek-rugs-full-en and admin-app).
  - `.github/workflows/ci.yml`

Why
---
- Prevents click-blocking bugs caused by overlays and ensures the navbar remains interactive.
- Enforces image proxy usage and lint rules across both apps via CI.

Verification
------------
- Local frontend ESLint run produced `tmp_eslint_frontend_quick.json` with zero errors/warnings for inspected files.
- Admin-app ESLint run produced `tmp_eslint_admin_quick.json` with zero errors/warnings (captured output).

Next steps
----------
1. (Optional) Run the site and spot-test card overlays and navbar behavior in browser.
2. Open a PR and let the CI matrix run on GitHub Actions.
3. Prepare and run a conservative codemod to replace direct `<img>` occurrences with the `ProxyImg` component across the repo in stages (admin thumbs 400, listing 800–1200, detail 1600).

How to push
-----------
- To push and create a PR:
  - `git push -u origin proxy-img-ui-fixes`
  - Open a PR from `proxy-img-ui-fixes` to your default branch and include this description.

Notes
-----
- I did not push or open a PR to avoid making remote changes without your sign-off.
- If you want, I can also prepare the codemod and run it on a small set of files and produce a preview patch for review.