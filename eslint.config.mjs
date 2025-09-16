import { defineConfig } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import pluginImport from 'eslint-plugin-import';
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    ignores: [
        '.next/**',
        'node_modules/**',
        'secrets-archive-*/**',
        'logs/**',
        'aytek-rugs-full-en/archived_csvs/**',
        'src/pages_backup/**'
    ],
        extends: compat.extends("next", "next/core-web-vitals"),
        plugins: { import: pluginImport },
        settings: {
            'import/resolver': {
                typescript: { project: ['./tsconfig.json', './admin-app/tsconfig.json'] },
                node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
            },
        },
    rules: {
        // Some files use `require()` in Node-side helpers; keep quiet at build-time.
    },
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