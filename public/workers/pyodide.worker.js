/*
 * RunX Pyodide execution worker (classic Web Worker).
 *
 * Loads Pyodide from the jsDelivr CDN, runs user-submitted Python under
 * sys.settrace(), and captures a snapshot of (line, call stack, locals, stdout)
 * at every executed line. The full snapshot array is serialized to JSON in
 * Python and posted back to the main thread.
 *
 * Message protocol
 * ----------------
 * main -> worker:  { type: "run", id, code, options? }
 * worker -> main:  { type: "status", status }        // loading the runtime
 *                  { type: "ready" }                  // Pyodide is loaded
 *                  { type: "init-error", error }      // runtime failed to load
 *                  { type: "result", id, result }     // RunResult (see types/snapshot.ts)
 *                  { type: "run-error", id, error }    // worker-side failure
 *
 * The shape of `result` mirrors the RunResult / Snapshot / ValueNode types in
 * src/types/snapshot.ts — keep the two in sync.
 */

const PYODIDE_VERSION = "0.28.3";
const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/";

importScripts(PYODIDE_BASE + "pyodide.js");

/*
 * The Python tracer. Defined once, invoked per run. Reads its inputs from the
 * Pyodide globals (__runx_source, __runx_max_*) and returns a JSON string.
 *
 * NOTE: this lives inside a JS template literal — do not use backticks or the
 * `${` sequence in the Python below.
 */
const TRACE_PROGRAM = `
import sys, io, json, math, types, traceback, collections, ast

_RUNX_FILENAME = "<runx>"

_RUNX_SKIP_NAMES = {
    "__name__", "__doc__", "__package__", "__loader__", "__spec__",
    "__builtins__", "__file__", "__cached__", "__annotations__",
}


def __runx_analyze_complexity(source):
    # Static rules-based facts for the complexity classifier: max loop nesting
    # and per-function recursion shape. Decides nothing on its own; the JS-side
    # classifier maps these to a Big-O string. Returns None if unparsable.
    try:
        tree = ast.parse(source)
    except Exception:
        return None

    def _is_int_literal(a):
        # range() bound that is a compile-time integer, incl. negative literals.
        if isinstance(a, ast.Constant) and type(a.value) is int:
            return True
        if (isinstance(a, ast.UnaryOp) and isinstance(a.op, ast.USub)
                and isinstance(a.operand, ast.Constant) and type(a.operand.value) is int):
            return True
        return False

    def _is_constant_for(node):
        # A for-loop whose iteration count is fixed at author time, so it adds
        # only O(1) and must NOT inflate the complexity class: range() over int
        # literals, or iterating a literal list/tuple/set/string.
        it = node.iter
        if (isinstance(it, ast.Call) and isinstance(it.func, ast.Name)
                and it.func.id == "range"):
            return len(it.args) > 0 and all(_is_int_literal(a) for a in it.args)
        if isinstance(it, (ast.List, ast.Tuple, ast.Set)):
            return True
        if isinstance(it, ast.Constant) and isinstance(it.value, str):
            return True
        return False

    def _is_scaling_loop(node):
        # Counts toward nesting depth only if it can grow with the input.
        # while-loops are treated as scaling (can't prove a constant bound).
        if isinstance(node, ast.While):
            return True
        if isinstance(node, (ast.For, ast.AsyncFor)):
            return not _is_constant_for(node)
        return False

    def max_loop_depth(node, cur):
        best = cur
        for child in ast.iter_child_nodes(node):
            nxt = cur + (1 if _is_scaling_loop(child) else 0)
            d = max_loop_depth(child, nxt)
            if d > best:
                best = d
        return best

    def callee_name(call):
        f = call.func
        if isinstance(f, ast.Name):
            return f.id
        if isinstance(f, ast.Attribute):
            return f.attr
        return None

    recursion = []
    for fn in ast.walk(tree):
        if not isinstance(fn, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        self_calls = 0
        shrink = "other"
        for sub in ast.walk(fn):
            if isinstance(sub, ast.Call) and callee_name(sub) == fn.name:
                self_calls += 1
                dump = " ".join(ast.dump(a) for a in sub.args)
                low = dump.lower()
                if "FloorDiv" in dump or "Div" in dump or "mid" in low or "half" in low:
                    shrink = "half"
                elif shrink != "half" and "Sub" in dump:
                    shrink = "decrement"
        if self_calls > 0:
            recursion.append({"name": fn.name, "selfCalls": self_calls, "shrink": shrink})

    return {"maxLoopDepth": max_loop_depth(tree, 0), "recursion": recursion}


def __runx_run(source, max_steps, max_items, max_depth, max_string, stdin_text):
    snapshots = []
    out = io.StringIO()
    state = {"error": None, "truncated": False, "executed": 0}

    # Once the snapshot budget is full we STOP recording but keep running the
    # program, so it finishes and produces real output + a real final state
    # instead of being aborted mid-run. hard_limit is the runaway/infinite-loop
    # guard on total executed lines (the client's wall-clock watchdog is the
    # ultimate backstop).
    hard_limit = max(max_steps * 60, 120000)

    class _StepLimit(Exception):
        pass

    def short_repr(v):
        try:
            r = repr(v)
        except Exception:
            r = "<unrepresentable>"
        if len(r) > max_string:
            r = r[:max_string] + "…"
        return r

    def serialize(v, depth, seen):
        if v is None:
            return {"kind": "none", "pyType": "NoneType", "repr": "None", "value": None}
        if v is True or v is False:
            return {"kind": "bool", "pyType": "bool", "repr": repr(v), "value": v}
        if isinstance(v, int):
            safe = -9007199254740991 <= v <= 9007199254740991
            return {"kind": "int", "pyType": "int", "repr": repr(v), "value": v if safe else None}
        if isinstance(v, float):
            finite = math.isfinite(v)
            return {"kind": "float", "pyType": "float", "repr": repr(v), "value": v if finite else None}
        if isinstance(v, str):
            return {"kind": "str", "pyType": "str", "repr": short_repr(v),
                    "value": v if len(v) <= max_string else v[:max_string] + "…"}

        oid = id(v)
        if oid in seen:
            return {"kind": "circular", "pyType": type(v).__name__, "repr": "<circular ref>", "id": oid}
        if depth >= max_depth:
            return {"kind": "truncated", "pyType": type(v).__name__, "repr": short_repr(v), "id": oid}

        if isinstance(v, (list, tuple)):
            seen2 = seen | {oid}
            kind = "list" if isinstance(v, list) else "tuple"
            items = []
            for i, el in enumerate(v):
                if i >= max_items:
                    break
                items.append(serialize(el, depth + 1, seen2))
            return {"kind": kind, "pyType": type(v).__name__, "repr": short_repr(v),
                    "id": oid, "items": items, "length": len(v), "truncated": len(v) > max_items}

        if isinstance(v, collections.deque):
            seen2 = seen | {oid}
            items = []
            for i, el in enumerate(v):
                if i >= max_items:
                    break
                items.append(serialize(el, depth + 1, seen2))
            return {"kind": "deque", "pyType": "deque", "repr": short_repr(v),
                    "id": oid, "items": items, "length": len(v), "truncated": len(v) > max_items}

        if isinstance(v, (set, frozenset)):
            seen2 = seen | {oid}
            items = []
            for i, el in enumerate(v):
                if i >= max_items:
                    break
                items.append(serialize(el, depth + 1, seen2))
            return {"kind": "set", "pyType": type(v).__name__, "repr": short_repr(v),
                    "id": oid, "items": items, "length": len(v), "truncated": len(v) > max_items}

        if isinstance(v, dict):
            seen2 = seen | {oid}
            entries = []
            for i, (k, val) in enumerate(v.items()):
                if i >= max_items:
                    break
                entries.append({"key": serialize(k, depth + 1, seen2),
                                "value": serialize(val, depth + 1, seen2)})
            return {"kind": "dict", "pyType": "dict", "repr": short_repr(v),
                    "id": oid, "entries": entries, "length": len(v), "truncated": len(v) > max_items}

        if isinstance(v, types.ModuleType):
            return {"kind": "module", "pyType": "module", "repr": short_repr(v), "id": oid}

        if callable(v):
            name = getattr(v, "__name__", None) or type(v).__name__
            return {"kind": "function", "pyType": type(v).__name__, "repr": name, "id": oid}

        d = getattr(v, "__dict__", None)
        if isinstance(d, dict):
            seen2 = seen | {oid}
            attrs = []
            count = 0
            for k, val in d.items():
                if count >= max_items:
                    break
                if isinstance(k, str) and k.startswith("__"):
                    continue
                attrs.append({"name": k, "value": serialize(val, depth + 1, seen2)})
                count += 1
            return {"kind": "object", "pyType": type(v).__name__, "repr": short_repr(v),
                    "id": oid, "attributes": attrs}

        return {"kind": "other", "pyType": type(v).__name__, "repr": short_repr(v), "id": oid}

    def collect_locals(frame):
        result = []
        for name, val in list(frame.f_locals.items()):
            if name in _RUNX_SKIP_NAMES:
                continue
            if name.startswith("__") and name.endswith("__"):
                continue
            result.append({"name": name, "value": serialize(val, 0, frozenset())})
        return result

    def build_stack(frame):
        frames = []
        f = frame
        while f is not None:
            if f.f_code.co_filename == _RUNX_FILENAME:
                frames.append(f)
            f = f.f_back
        frames.reverse()
        return [{
            "functionName": fr.f_code.co_name,
            "line": fr.f_lineno,
            "locals": collect_locals(fr),
        } for fr in frames]

    def record(frame, event, arg):
        snap = {
            "step": len(snapshots),
            "line": frame.f_lineno,
            "event": event,
            "stack": build_stack(frame),
            "stdout": out.getvalue(),
        }
        if event == "return":
            snap["returnValue"] = serialize(arg, 0, frozenset())
        snapshots.append(snap)

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != _RUNX_FILENAME:
            return None
        if event not in ("line", "call", "return", "exception"):
            return tracer
        state["executed"] += 1
        if len(snapshots) < max_steps:
            record(frame, event, arg)
        else:
            # Budget full: keep running (so the program completes) but record
            # nothing more, until the hard ceiling trips the runaway guard.
            state["truncated"] = True
            if state["executed"] > hard_limit:
                raise _StepLimit()
        return tracer

    user_globals = {"__name__": "__main__"}

    # stdin support: feed the user-provided text to input() and sys.stdin, so
    # input()-based programs run instead of hanging. input() is shadowed in the
    # user's globals (not builtins) and reads line-by-line from the same buffer.
    _stdin_buf = io.StringIO(stdin_text or "")

    def __runx_input(prompt=""):
        line = _stdin_buf.readline()
        if line == "":
            raise EOFError("EOF when reading a line")
        return line.rstrip(chr(13) + chr(10))

    user_globals["input"] = __runx_input

    real_stdout = sys.stdout
    real_stdin = sys.stdin
    sys.stdout = out
    sys.stdin = _stdin_buf
    try:
        compiled = compile(source, _RUNX_FILENAME, "exec")
    except SyntaxError as e:
        sys.stdout = real_stdout
        sys.stdin = real_stdin
        state["error"] = {
            "type": type(e).__name__,
            "message": str(e.msg),
            "line": e.lineno,
            "traceback": traceback.format_exc(),
        }
        return json.dumps({"snapshots": [], "stdout": "", "error": state["error"], "truncated": False})

    sys.settrace(tracer)
    try:
        exec(compiled, user_globals)
    except _StepLimit:
        pass
    except BaseException as e:
        lineno = None
        tb = e.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == _RUNX_FILENAME:
                lineno = tb.tb_lineno
            tb = tb.tb_next
        state["error"] = {
            "type": type(e).__name__,
            "message": str(e),
            "line": lineno,
            "traceback": traceback.format_exc(),
        }
    finally:
        sys.settrace(None)
        sys.stdout = real_stdout
        sys.stdin = real_stdin

    # If we stopped recording early but the program finished, capture one final
    # snapshot of the module-level state so the user still sees the end result
    # (the sorted list, the computed answer) rather than just the first N steps.
    if state["truncated"] and state["error"] is None:
        final_locals = []
        for name, val in list(user_globals.items()):
            if name in _RUNX_SKIP_NAMES:
                continue
            if name.startswith("__") and name.endswith("__"):
                continue
            if isinstance(val, types.ModuleType) or callable(val):
                continue
            final_locals.append({"name": name, "value": serialize(val, 0, frozenset())})
        snapshots.append({
            "step": len(snapshots),
            "line": 0,
            "event": "line",
            "stack": [{"functionName": "<module>", "line": 0, "locals": final_locals}],
            "stdout": out.getvalue(),
            "final": True,
        })

    return json.dumps({
        "snapshots": snapshots,
        "stdout": out.getvalue(),
        "error": state["error"],
        "truncated": state["truncated"],
        "complexity": __runx_analyze_complexity(source),
    })


__runx_run(
    __runx_source,
    __runx_max_steps,
    __runx_max_items,
    __runx_max_depth,
    __runx_max_string,
    __runx_stdin,
)
`;

let pyodide = null;
let loadPromise = null;

function ensurePyodide() {
  if (!loadPromise) {
    loadPromise = (async () => {
      self.postMessage({ type: "status", status: "loading-runtime" });
      pyodide = await loadPyodide({ indexURL: PYODIDE_BASE });
      self.postMessage({ type: "ready" });
      return pyodide;
    })();
  }
  return loadPromise;
}

// Start loading the runtime as soon as the worker spins up.
ensurePyodide().catch((err) => {
  self.postMessage({
    type: "init-error",
    error: String((err && err.message) || err),
  });
});

self.onmessage = async (event) => {
  const data = event.data || {};
  if (data.type !== "run") return;

  const { id, code, options } = data;
  const opts = options || {};
  const started = Date.now();

  try {
    const py = await ensurePyodide();
    py.globals.set("__runx_source", code);
    py.globals.set("__runx_max_steps", opts.maxSteps ?? 2000);
    py.globals.set("__runx_max_items", opts.maxItems ?? 100);
    py.globals.set("__runx_max_depth", opts.maxDepth ?? 5);
    py.globals.set("__runx_max_string", opts.maxString ?? 200);
    py.globals.set("__runx_stdin", opts.stdin ?? "");

    // Runtime is loaded; user code is about to execute. Lets the client start
    // its execution watchdog now (separate from the slower first-load budget).
    self.postMessage({ type: "running", id });

    const resultJson = await py.runPythonAsync(TRACE_PROGRAM);
    const result = JSON.parse(resultJson);
    result.durationMs = Date.now() - started;

    self.postMessage({ type: "result", id, result });
  } catch (err) {
    self.postMessage({
      type: "run-error",
      id,
      error: String((err && err.message) || err),
    });
  }
};
