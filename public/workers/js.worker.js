/*
 * RunX JavaScript execution worker (classic Web Worker).
 *
 * Runs user-submitted JavaScript inside this worker — never on the main thread
 * and never via direct eval(): the source is compiled with the AsyncFunction
 * constructor, so top-level `await` works and the code executes in a fresh
 * function scope each run. console output is captured line by line; prompt() /
 * readline() read from the stdin text supplied with the run.
 *
 * TWO run modes, chosen by the client:
 *   traced = true   The client sends code INSTRUMENTED by js-tracer/instrument.ts
 *                   — it carries $rx_trace/$rx_enter/$rx_exit hook calls. We
 *                   supply those hooks and build a full Snapshot[] (per-line
 *                   stack, locals serialized to ValueNode) exactly like the
 *                   Python tracer, so the Explain tab + visualizers work for JS.
 *   traced = false  Plain run (instrumentation failed or was skipped): ONE
 *                   synthetic final snapshot whose stdout holds the console
 *                   output, so the Output panel still works.
 *
 * Message protocol — identical to pyodide.worker.js so the client watchdog is
 * shared by shape:
 * main -> worker:  { type: "run", id, code, traced?, options? }
 * worker -> main:  { type: "ready" } | { type: "running", id }
 *                  { type: "result", id, result } | { type: "run-error", id, error }
 *
 * Keep the serializer/Snapshot shape in sync with src/types/snapshot.ts.
 */

/** Compiled-source line of the user's first line (AsyncFunction adds a header). */
var USER_LINE_OFFSET = 3;

/** Serializer limits — keep traces bounded in size and time. */
var MAX_DEPTH = 5;
var MAX_ITEMS = 200;
var MAX_ATTRS = 100;
/** Trace limits — kill runaway programs and bound memory. */
var MAX_STEPS = 200000;
var MAX_SNAPSHOTS = 20000;

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
    for (var i = 0; i < v.length && i < 100; i++) parts.push(formatValue(v[i], depth + 1, seen2));
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
  var prefix = typeName(v);
  return (prefix && prefix !== "Object" ? prefix + " " : "") + "{ " + op.join(", ") + " }";
}

function formatArgs(args) {
  var parts = [];
  for (var i = 0; i < args.length; i++) parts.push(formatValue(args[i], 0, []));
  return parts.join(" ");
}

/** Short repr string for a ValueNode. */
function shortRepr(v) {
  var s = formatValue(v, 0, []);
  return s.length > 80 ? s.slice(0, 79) + "…" : s;
}

function typeName(v) {
  try {
    if (v && v.constructor && v.constructor.name) return v.constructor.name;
  } catch (e) {
    /* proxies etc. */
  }
  return "Object";
}

function isTypedArray(v) {
  return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(v) && !(v instanceof DataView);
}

/** Build a JS-value → ValueNode serializer with run-stable ids (for aliasing). */
function makeSerializer() {
  var idMap = new Map();
  var nextId = 1;
  function idOf(o) {
    var e = idMap.get(o);
    if (e) return e;
    var n = nextId++;
    idMap.set(o, n);
    return n;
  }

  function ser(v, depth, seen) {
    if (v === null) return { kind: "none", pyType: "null", repr: "null", value: null };
    var t = typeof v;
    if (t === "undefined") return { kind: "none", pyType: "undefined", repr: "undefined", value: null };
    if (t === "number")
      return { kind: Number.isInteger(v) ? "int" : "float", pyType: "number", repr: String(v), value: v };
    if (t === "bigint") return { kind: "int", pyType: "bigint", repr: v.toString() + "n", value: v.toString() };
    if (t === "string") return { kind: "str", pyType: "string", repr: JSON.stringify(v), value: v };
    if (t === "boolean") return { kind: "bool", pyType: "boolean", repr: String(v), value: v };
    if (t === "symbol") return { kind: "other", pyType: "symbol", repr: v.toString() };
    if (t === "function")
      return { kind: "function", pyType: "function", repr: "[Function: " + (v.name || "anonymous") + "]", id: idOf(v) };

    var oid = idOf(v);
    if (seen.indexOf(v) !== -1) return { kind: "circular", pyType: typeName(v), repr: "[Circular]", id: oid };
    if (depth >= MAX_DEPTH)
      return { kind: "truncated", pyType: typeName(v), repr: Array.isArray(v) ? "[Array]" : "[Object]", id: oid };
    var seen2 = seen.concat([v]);

    if (Array.isArray(v) || isTypedArray(v)) {
      var items = [];
      var n = v.length;
      for (var i = 0; i < n && i < MAX_ITEMS; i++) items.push(ser(v[i], depth + 1, seen2));
      return {
        kind: "list",
        pyType: isTypedArray(v) ? typeName(v) : "Array",
        repr: shortRepr(v),
        id: oid,
        items: items,
        length: n,
        truncated: n > MAX_ITEMS,
      };
    }
    if (v instanceof Map) {
      var entries = [];
      var mc = 0;
      v.forEach(function (val, key) {
        if (mc < MAX_ITEMS) {
          entries.push({ key: ser(key, depth + 1, seen2), value: ser(val, depth + 1, seen2) });
          mc++;
        }
      });
      return { kind: "dict", pyType: "Map", repr: shortRepr(v), id: oid, entries: entries, length: v.size, truncated: v.size > MAX_ITEMS };
    }
    if (v instanceof Set) {
      var sitems = [];
      var sc = 0;
      v.forEach(function (val) {
        if (sc < MAX_ITEMS) {
          sitems.push(ser(val, depth + 1, seen2));
          sc++;
        }
      });
      return { kind: "set", pyType: "Set", repr: shortRepr(v), id: oid, items: sitems, length: v.size, truncated: v.size > MAX_ITEMS };
    }

    // Plain object / class instance → attributes (JS objects are records/nodes).
    var keys;
    try {
      keys = Object.keys(v);
    } catch (e) {
      keys = [];
    }
    var attrs = [];
    for (var k = 0; k < keys.length && k < MAX_ATTRS; k++) {
      var name = keys[k];
      var val;
      try {
        val = v[name];
      } catch (e) {
        continue; // skip throwing getters
      }
      attrs.push({ name: name, value: ser(val, depth + 1, seen2) });
    }
    return {
      kind: "object",
      pyType: typeName(v),
      repr: shortRepr(v),
      id: oid,
      attributes: attrs,
      length: keys.length,
      truncated: keys.length > MAX_ATTRS,
    };
  }

  return ser;
}

/** Shared console/stdin setup for a run. */
function makeIO(opts) {
  var lines = [];
  var runxConsole = {};
  ["log", "info", "warn", "error", "debug"].forEach(function (level) {
    runxConsole[level] = function () {
      lines.push(formatArgs(arguments));
    };
  });
  var stdinLines = String(opts.stdin || "").split("\n");
  var stdinIdx = 0;
  var readline = function () {
    return stdinIdx < stdinLines.length ? stdinLines[stdinIdx++] : null;
  };
  return { lines: lines, console: runxConsole, readline: readline };
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

/* ── Traced run: instrumented code + trace hooks → full Snapshot[] ─────────── */

async function executeTraced(code, options) {
  var opts = options || {};
  var started = Date.now();
  var io = makeIO(opts);
  var lines = io.lines;
  var ser = makeSerializer();

  var snapshots = [];
  var stack = [{ functionName: "<module>", line: 0, locals: [] }];
  var steps = 0;
  var truncated = false;
  var lastLine = 0;

  function currentStdout() {
    return lines.length ? lines.join("\n") + "\n" : "";
  }
  function serializeScope(scope) {
    var out = [];
    var keys = Object.keys(scope);
    for (var i = 0; i < keys.length; i++) {
      out.push({ name: keys[i], value: ser(scope[keys[i]], 0, []) });
    }
    return out;
  }
  function cloneStack() {
    return stack.map(function (f) {
      return { functionName: f.functionName, line: f.line, locals: f.locals };
    });
  }

  function $rx_trace(line, scope) {
    steps++;
    if (steps > MAX_STEPS || snapshots.length >= MAX_SNAPSHOTS) {
      truncated = true;
      throw { $rxBudget: true };
    }
    lastLine = line;
    var top = stack[stack.length - 1];
    top.line = line;
    top.locals = serializeScope(scope); // fresh array each step; prior snapshots keep theirs
    snapshots.push({ step: snapshots.length, line: line, event: "line", stack: cloneStack(), stdout: currentStdout() });
  }
  function $rx_enter(name, line) {
    stack.push({ functionName: name || "<anonymous>", line: line || 0, locals: [] });
  }
  function $rx_exit() {
    if (stack.length > 1) stack.pop();
  }

  var error = null;
  try {
    var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    var fn = new AsyncFunction(
      "console",
      "prompt",
      "readline",
      "$rx_trace",
      "$rx_enter",
      "$rx_exit",
      '"use strict";\n' + code
    );
    await fn.call(undefined, io.console, io.readline, io.readline, $rx_trace, $rx_enter, $rx_exit);
  } catch (e) {
    if (e && e.$rxBudget) {
      truncated = true;
    } else {
      error = {
        type: (e && e.name) || "Error",
        message: (e && e.message) != null ? String(e.message) : String(e),
        line: lastLine > 0 ? lastLine : null,
        traceback: (e && e.stack) || String(e),
      };
    }
  }

  var stdout = currentStdout();
  if (snapshots.length === 0) {
    snapshots.push({
      step: 0,
      line: 0,
      event: "line",
      stack: [{ functionName: "<module>", line: 0, locals: [] }],
      stdout: stdout,
      final: true,
    });
  }
  return { snapshots: snapshots, stdout: stdout, error: error, truncated: truncated, durationMs: Date.now() - started };
}

/* ── Plain run (fallback): one synthetic final snapshot with stdout ────────── */

async function executeJS(code, options) {
  var opts = options || {};
  var started = Date.now();
  var io = makeIO(opts);
  var lines = io.lines;

  var error = null;
  try {
    var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    var fn = new AsyncFunction("console", "prompt", "readline", '"use strict";\n' + code);
    await fn.call(undefined, io.console, io.readline, io.readline);
  } catch (e) {
    error = {
      type: (e && e.name) || "Error",
      message: (e && e.message) != null ? String(e.message) : String(e),
      line: extractLine(e),
      traceback: (e && e.stack) || String(e),
    };
  }

  var stdout = lines.length > 0 ? lines.join("\n") + "\n" : "";
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
  return { snapshots: snapshots, stdout: stdout, error: error, truncated: false, durationMs: Date.now() - started };
}

self.postMessage({ type: "ready" });

self.onmessage = async function (event) {
  var data = event.data || {};
  if (data.type !== "run") return;
  var id = data.id;

  self.postMessage({ type: "running", id: id });

  try {
    var result = data.traced
      ? await executeTraced(data.code, data.options)
      : await executeJS(data.code, data.options);
    self.postMessage({ type: "result", id: id, result: result });
  } catch (err) {
    self.postMessage({
      type: "run-error",
      id: id,
      error: String((err && err.message) || err),
    });
  }
};
