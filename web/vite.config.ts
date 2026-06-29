/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative asset URLs so the build works under any path prefix — served both at
  // console.freeappstore.online/ and proxied under freeappstore.online/app/.
  // The actual prefix is resolved at runtime via the injected <base href> (see index.html).
  base: "./",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**"],
    globals: true,
    setupFiles: "./src/test/setup.ts",
    reporters: ["default", "json"],
    outputFile: { json: "test-results/results.json" },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "./test-results/coverage",
    },
  },
});
