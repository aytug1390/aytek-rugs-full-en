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
        // Prevent developers from embedding direct Drive/LH3 hostnames in client code.
        // Use `getDriveImageSrc()` or `/api/drive?...` instead so images are proxied.
        "no-restricted-syntax": [
            "error",
            {
                selector: "Literal[value=/lh3\\.googleusercontent\\.com|drive\\.google\\.com|drive\\.usercontent\\.google\\.com/ ]",
                message: "Do not reference Drive/LH3 hostnames directly in client code. Use the same-origin `/api/drive?src=...` proxy or `getDriveImageSrc()`.",
            },
        ],
    },
}, {
    files: ["app/admin/reviews/page.jsx", "app/admin/rugs/page.jsx"],

    rules: {
        "react-hooks/exhaustive-deps": "off",
    },
}]);