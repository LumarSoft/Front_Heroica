// eslint.config.js (o eslint.config.mjs)
import tseslint from "typescript-eslint";

export default tseslint.config(
  tseslint.configs.recommended,
  {
    rules: {
      // Podés ajustar estas reglas a tu gusto
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
  {
    // Ignorar archivos de build y config
    ignores: ["dist/**", "node_modules/**"],
  }
);