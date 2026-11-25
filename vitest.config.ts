import { configDefaults, defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Use jsdom for component tests; pure-logic tests still run fine here
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    // Playwright specs in e2e/ run under `npm run test:e2e`, not Vitest
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
