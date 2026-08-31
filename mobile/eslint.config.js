import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import expo from "eslint-config-expo/flat.js";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.expo/**",
      "**/web-build/**",
      "**/coverage/**",
      "**/*.lock",
      "**/*.toml",
      "expo-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...expo,
  prettier,
  {
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.json"],
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
