import { defineConfig } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    // ignore build artifacts and deps (use `ignores` instead of .eslintignore)
    ignores: ['.next', 'node_modules', 'dist', 'build'],
}, {
    extends: compat.extends("next", "next/core-web-vitals"),
}, {
    files: [
        "app/**/*.jsx",
        "app/**/*.tsx",
        "components/**/*.jsx",
        "components/**/*.tsx",
    ],

    rules: {
        "@next/next/no-img-element": "off",
    },
}, {
    files: ["app/admin/reviews/page.jsx", "app/admin/rugs/page.jsx"],

    rules: {
        "react-hooks/exhaustive-deps": "off",
    },
}]);