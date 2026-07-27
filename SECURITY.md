# Security

RunX executes user-submitted code entirely client-side, in isolated
sandboxes: Python runs inside a Pyodide Web Worker, JavaScript runs inside
its own dedicated Web Worker via `AsyncFunction` (never `eval`, never the
main thread). Neither has access to the DOM, the network, or the rest of the
page.

If you find a way for submitted code to escape its worker sandbox, or any
other security issue, please open a GitHub issue with the details.
