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
    ignores: ["agent.js", "tools.js", "lib/agent-core.js", "lib/csv-adapt.js", "lib/merchant.js", "lib/accounts.js", "lib/profile-store.js", "lib/export/**", "stress-test/**", ".next/**", "next-env.d.ts"],
  },
  {
    // Keep the web app free of the ways HTML or code can be injected from text.
    // React escapes everything it renders; these rules stop anyone bypassing that.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react/no-danger": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
];

export default eslintConfig;
