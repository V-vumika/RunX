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
    // Windows + vitest 4 worker pool intermittently fails to hand the config to
    // workers ("reading 'config'"). Pin to a single fork so the whole suite runs
    // in one stable process — it's tiny and pure, so serial costs nothing.
    pool: "threads",
    fileParallelism: false,
    maxWorkers: 1,
    isolate: false,
  },
});
