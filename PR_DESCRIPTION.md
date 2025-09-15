Branch: proxy-img-ui-fixes-clean

This branch contains a minimal, clean set of changes:

- UI fixes to ensure sticky navbar remains above overlays (increase navbar z-index to `z-80`, normalize overlays to `z-70`).
- Added `.gitignore` to exclude temp and backup files.
- Added a CI workflow to run ESLint for `aytek-rugs-full-en` and `admin-app`.
- Included the `aytek-rugs-full-en` subproject (with navbar fixes) and admin `ProxyImg` shim.

Files included (representative):
- `.gitignore`
- `.github/workflows/ci.yml`
- `aytek-rugs-full-en/src/components/Navbar.jsx`
- `aytek-rugs-full-en/app/components/NavbarClient.jsx`
- `aytek-rugs-full-en/src/components/ProductCard.tsx`
- `aytek-rugs-full-en/styles/globals.css`
- `admin-app/app/components/ProxyImg.tsx` (shim)

Purpose: make a small, reviewable PR with only essential changes to fix the overlay/navbar bug and add lint CI enforcement. Large temp/bak files were removed from the index prior to creating this branch.
