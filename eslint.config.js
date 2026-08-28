import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";
import expo from "eslint-config-expo/flat.js";

const expoForMobile = expo.map((cfg) => {
  if (cfg.ignores) return cfg;
  return {
    ...cfg,
    files: cfg.files ?? ["mobile/**/*.{js,ts,tsx}"],
  };
});

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.expo/**",
      "**/web-build/**",
      "**/generated/**",
      "**/coverage/**",
      ".agents/**",
      "server/prisma/migrations/**",
      "**/*.lock",
      "**/*.toml",
      "mobile/expo-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["server/**/*.{ts,js}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  ...expoForMobile,
  {
    files: ["mobile/**/*.{ts,tsx,js}"],
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./mobile/tsconfig.json", "./server/tsconfig.json"],
        },
        node: true,
      },
    },
  },
  {
    files: ["eslint.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
