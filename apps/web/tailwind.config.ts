import type { Config } from "tailwindcss";
import baseConfig from "@le-poulet/config/tailwind";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      ...baseConfig.theme?.extend,
    },
  },
  plugins: [],
};

export default config;
