// eslint.config.mjs
import * as nextPluginNS from '@next/eslint-plugin-next';
const nextPlugin = nextPluginNS.default ?? nextPluginNS; // CJS/ESM uyumlu import
const nextCoreRules = nextPlugin?.configs?.['core-web-vitals']?.rules ?? {};
import * as reactNS from 'eslint-plugin-react';
import * as reactHooksNS from 'eslint-plugin-react-hooks';
import * as reactRefreshNS from 'eslint-plugin-react-refresh';
import * as tailwindNS from 'eslint-plugin-tailwindcss';
import * as tsParserNS from '@typescript-eslint/parser';
import * as globalsNS from 'globals';

// CJS/ESM-safe plugin/parser shims
const react = reactNS.default ?? reactNS;
const reactHooks = reactHooksNS.default ?? reactHooksNS;
const reactRefresh = reactRefreshNS.default ?? reactRefreshNS;
const tailwind = tailwindNS.default ?? tailwindNS;
const tsParser = tsParserNS.default ?? tsParserNS;

// Safe globals extraction
const globalsPkg = globalsNS.default ?? globalsNS;
const browserGlobals = globalsPkg?.browser ?? {};
const nodeGlobals = globalsPkg?.node ?? {};

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Top-level plugin registration so Next's detection sees @next/next
  {
    plugins: {
      '@next/next': nextPlugin,
    },
  },
  // .eslintignore yerine
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      '.turbo/**',
      'dist/**',
      'coverage/**',
      'src/pages_backup/**',
      'tmp_*.mjs',
      'aytek-rugs/**',
    ],
  },

  // Uygulama için genel kurallar
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
        Response: 'readonly',
        Headers: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
      },
    },
      plugins: {
        '@next/next': nextPlugin,
        react,
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
        tailwind,
      },
    rules: {
  // Next “core-web-vitals” (safe reference)
  ...nextCoreRules,

      // React/Hooks
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Geçici gürültü azaltma (istersen kapatabilirsin)
      'no-unused-vars': 'off',
    },
    settings: {
      react: { version: 'detect' },
      tailwindcss: { callees: ['cn'] },
    },
  },

  // TS dosyaları parser
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser },
  },

  // Node ortamındaki dosyalar (config & script’ler)
  {
    files: [
      'next.config.js',
      'postcss.config.js',
      'tailwind.config.js',
      'eslint.config.js',
      'lib/**/*.js',
      'scripts/**/*.{js,mjs,cjs}',
      'tmp_*.mjs',
    ],
    languageOptions: {
      globals: {
        ...nodeGlobals,
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: { 'no-undef': 'off' },
  },

  // App Route (Edge/Web) API’leri
  {
    files: ['app/api/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        Response: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
      },
    },
  },
];