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
    ignores: ["agent.js", "tools.js", "lib/agent-core.js", "lib/csv-adapt.js", "lib/merchant.js", "lib/accounts.js", "stress-test/**", ".next/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
