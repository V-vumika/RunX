import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Node-only unit tests for the pure engine logic (classifier, narrator, entry
// detection, support check). These don't touch Pyodide — they run against real
// source strings and small synthetic Snapshot fixtures — so they're fast and
// catch the heuristic regressions we keep hitting (e.g. "search" shadowing a
// Trie, swap-detection string matches, entry-point parsing).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Windows + vitest 4 worker pool can fail to hand the config to parallel
    // workers ("reading 'config'"); running files serially avoids it. The suite
    // is tiny and pure, so this costs nothing.
    fileParallelism: false,
  },
});
