import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTypescript from "eslint-config-next/typescript.js";
import prettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default defineConfig([
  js.configs.recommended,
  ...compat.config(nextVitals),
  ...compat.config(nextTypescript),
  prettier,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);
