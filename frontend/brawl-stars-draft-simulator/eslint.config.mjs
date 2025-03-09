import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// __filename and __dirname setup for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next', 'eslint:recommended'],  // Added 'eslint:recommended' for general JS rules
    parser: "@babel/eslint-parser",  // This is for JavaScript parsing
    parserOptions: {
      ecmaVersion: 2020,  // Ensure support for modern JavaScript features
      sourceType: "module",  // ES Modules (important for Next.js)
      ecmaFeatures: {
        jsx: true,  // Enable support for JSX
      },
    },
    settings: {
      react: {
        version: "detect",  // Automatically detect the React version
      },
    },
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
      'no-console': 'warn',  // Example of a custom rule: Warn on console logs
      'react/prop-types': 'off',  // If you're using TypeScript, disable prop-types rule
    },
  }),
];

export default eslintConfig;
