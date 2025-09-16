// Compatibility wrapper at repo root to satisfy imports like `@/components/sections/Hero`.
// This forwards to the real Hero implementation inside the `aytek-rugs-full-en` app.
// relative path: from repo-root/components/sections -> ../../aytek-rugs-full-en/app/components/Hero
export { default } from "../../aytek-rugs-full-en/app/components/Hero";
