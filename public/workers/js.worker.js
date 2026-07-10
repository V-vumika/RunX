/*
 * RunX JavaScript execution worker (classic Web Worker).
 *
 * Runs user-submitted JavaScript inside this worker — never on the main thread
 * and never via direct eval(): the source is compiled with the AsyncFunction
 * constructor, so top-level `await` works and the code executes in a fresh
 * function scope each run (no global pollution between runs). console output
 * is captured line by line; `prompt()` / `readline()` read from the stdin text
 * supplied with the run.
 *
 * Message protocol — identical to pyodide.worker.js so the client watchdog
 * logic is shared by shape:
 * main -> worker:  { type: "run", id, code, options? }
 * worker -> main:  { type: "ready" }                  // worker is loaded (immediate)
 *                  { type: "running", id }            // user code is about to execute
 *                  { type: "result", id, result }     // RunResult (see types/snapshot.ts)
 *                  { type: "run-error", id, error }   // worker-side failure
 *
 * There is no per-line tracer here yet — that's the Phase 9 JS tracer (AST
 * instrumentation). Until then the result carries ONE synthetic final-state
 * snapshot (`final: true`, empty locals) whose `stdout` holds the full console
 * output, so the existing Output panel and step controls work unchanged.
 */

/** Compiled-source line of the user's first line (AsyncFunction adds a header). */
var USER_LINE_OFFSET = 3;

/** Node-console-ish, cycle-safe, depth-capped formatting of one logged value. */
function formatValue(v, depth, seen) {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  var t = typeof v;
  if (t === "string") return depth === 0 ? v : "'" + v + "'";
  if (t === "number" || t === "boolean" || t === "bigint") return String(v);
  if (t === "function") return "[Function: " + (v.name || "anonymous") + "]";
  if (t === "symbol") return v.toString();

  if (seen.indexOf(v) !== -1) return "[Circular]";
  if (depth >= 4) return Array.isArray(v) ? "[Array]" : "[Object]";
  var seen2 = seen.concat([v]);

  if (Array.isArray(v)) {
    var parts = [];
    for (var i = 0; i < v.length && i < 100; i++) {
      parts.push(formatValue(v[i], depth + 1, seen2));
    }
    if (v.length > 100) parts.push("… " + (v.length - 100) + " more");
    return "[ " + parts.join(", ") + " ]";
  }
  if (v instanceof Error) return v.name + ": " + v.message;
  if (v instanceof Map) {
    var mp = [];
    v.forEach(function (val, key) {
      mp.push(formatValue(key, depth + 1, seen2) + " => " + formatValue(val, depth + 1, seen2));
    });
    return "Map(" + v.size + ") { " + mp.join(", ") + " }";
  }
  if (v instanceof Set) {
    var sp = [];
    v.forEach(function (val) {
      sp.push(formatValue(val, depth + 1, seen2));
    });
    return "Set(" + v.size + ") { " + sp.join(", ") + " }";
  }

  var keys = Object.keys(v);
  var op = [];
  for (var k = 0; k < keys.length && k < 50; k++) {
    op.push(keys[k] + ": " + formatValue(v[keys[k]], depth + 1, seen2));
  }
  if (keys.length > 50) op.push("… " + (keys.length - 50) + " more");
  return "{ " + op.join(", ") + " }";
}

function formatArgs(args) {
  var parts = [];
  for (var i = 0; i < args.length; i++) parts.push(formatValue(args[i], 0, []));
  return parts.join(" ");
}

/** Best-effort source line of an error thrown from AsyncFunction-compiled code. */
function extractLine(err) {
  var stack = err && err.stack;
  if (typeof stack !== "string") return null;
  var m = stack.match(/<anonymous>:(\d+):\d+/);
  if (!m) return null;
  var line = parseInt(m[1], 10) - USER_LINE_OFFSET;
  return line >= 1 ? line : null;
}

/**
 * Execute one program and build a RunResult (shape mirrors
 * src/types/snapshot.ts — keep the two in sync).
 */
async function executeJS(code, options) {
  var opts = options || {};
  var started = Date.now();
  var lines = [];

  var runxConsole = {};
  ["log", "info", "warn", "error", "debug"].forEach(function (level) {
    runxConsole[level] = function () {
      lines.push(formatArgs(arguments));
    };
  });

  // stdin: prompt()/readline() hand out one line per call, null at EOF —
  // the JS counterpart of the Python worker's shadowed input().
  var stdinLines = String(opts.stdin || "").split("\n");
  var stdinIdx = 0;
  var readline = function () {
    return stdinIdx < stdinLines.length ? stdinLines[stdinIdx++] : null;
  };

  var error = null;
  try {
    // AsyncFunction — not eval, not main thread. `"use strict"` keeps user
    // var/function declarations inside this scope instead of the worker global.
    var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    var fn = new AsyncFunction(
      "console",
      "prompt",
      "readline",
      '"use strict";\n' + code
    );
    await fn.call(undefined, runxConsole, readline, readline);
  } catch (e) {
    error = {
      type: (e && e.name) || "Error",
      message: (e && e.message) != null ? String(e.message) : String(e),
      line: extractLine(e),
      traceback: (e && e.stack) || String(e),
    };
  }

  var stdout = lines.length > 0 ? lines.join("\n") + "\n" : "";

  // One synthetic final-state snapshot so the existing panels (which read
  // stdout off the current snapshot) work without a per-line tracer.
  var snapshots = [
    {
      step: 0,
      line: 0,
      event: "line",
      stack: [{ functionName: "<module>", line: 0, locals: [] }],
      stdout: stdout,
      final: true,
    },
  ];

  return {
    snapshots: snapshots,
    stdout: stdout,
    error: error,
    truncated: false,
    durationMs: Date.now() - started,
  };
}

self.postMessage({ type: "ready" });

self.onmessage = async function (event) {
  var data = event.data || {};
  if (data.type !== "run") return;
  var id = data.id;

  // Lets the client swap its load watchdog for the shorter exec budget.
  self.postMessage({ type: "running", id: id });

  try {
    var result = await executeJS(data.code, data.options);
    self.postMessage({ type: "result", id: id, result: result });
  } catch (err) {
    self.postMessage({
      type: "run-error",
      id: id,
      error: String((err && err.message) || err),
    });
  }
};
