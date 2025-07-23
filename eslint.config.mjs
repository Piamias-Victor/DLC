import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      ".vercel/**",
      "**/.prisma/**",
      "**/prisma/migrations/**",
      "src/generated/**",
      "**/generated/**",
      "**/*.wasm.js",
      "**/*.generated.*",
    ]
  },
  {
    rules: {
      // Désactiver les règles problématiques pour les fichiers générés
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off", 
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-this-alias": "off",
    }
  }
];

export default eslintConfig;