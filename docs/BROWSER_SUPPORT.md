# Browser support

RunX needs a modern browser with:

- **Web Workers** — both the Python (Pyodide) and JavaScript tracers run in
  dedicated workers, never on the main thread.
- **WebAssembly** — Pyodide is a WASM build of CPython; without WASM support
  Python execution can't load at all.
- **ES2020+ JavaScript** — the app itself targets modern evergreen browsers
  (no IE11/legacy polyfills).
- A reasonably fast connection for the *first* Python run only — Pyodide is
  fetched from a CDN (`https://cdn.jsdelivr.net/pyodide/...`) the first time
  you run Python in a session; it's cached by the browser after that.

Tested primarily on current Chrome, Edge, and Firefox. Safari should work
(same Web Worker + WASM baseline) but gets less regular manual testing.

JavaScript execution has no CDN dependency — the tracer (acorn + astring) is
bundled with the app, so JS runs work offline once the page itself has
loaded.
