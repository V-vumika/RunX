/**
 * Shared types describing the execution trace produced by the Pyodide worker.
 *
 * The Python tracer (public/workers/pyodide.worker.js) serializes each executed
 * line into a {@link Snapshot}. Variables are serialized into a recursive
 * {@link ValueNode} tree that the Variable Inspector renders today and that the
 * DSA / memory visualizers will consume later.
 *
 * Keep this file in sync with the `serialize()` logic in the worker.
 */

/** Kind discriminator for a serialized Python value. */
export type ValueKind =
  | "int"
  | "float"
  | "str"
  | "bool"
  | "none"
  | "list"
  | "tuple"
  | "set"
  | "deque"
  | "dict"
  | "object"
  | "function"
  | "module"
  | "circular"
  | "truncated"
  | "other";

/** A recursively-serialized Python value. */
export interface ValueNode {
  kind: ValueKind;
  /** Concrete Python type name, e.g. "int", "list", "MyClass". */
  pyType: string;
  /** Short, safe repr() of the value — always present for display. */
  repr: string;
  /** Stable id() of the underlying object (used to detect aliasing/cycles). */
  id?: number;
  /** JSON-safe scalar value for primitive kinds (int/float/str/bool/none). */
  value?: string | number | boolean | null;
  /** Child items for list/tuple/set/deque. */
  items?: ValueNode[];
  /** Key/value pairs for dict. */
  entries?: { key: ValueNode; value: ValueNode }[];
  /** Public attributes for plain objects. */
  attributes?: { name: string; value: ValueNode }[];
  /** True when items/entries/attributes were truncated for size. */
  truncated?: boolean;
  /** Number of elements before truncation (len), when meaningful. */
  length?: number;
}

/** A single named variable in a frame's local scope. */
export interface Variable {
  name: string;
  value: ValueNode;
}

/** One activation record in the call stack at a given step. */
export interface StackFrame {
  /** Function name; "<module>" for top-level code. */
  functionName: string;
  /** Line currently being executed within this frame. */
  line: number;
  /** Local variables visible in this frame. */
  locals: Variable[];
}

/** The kind of trace event that produced a snapshot. */
export type TraceEvent = "line" | "call" | "return" | "exception";

/** A single step of execution: the program state before a line runs. */
export interface Snapshot {
  /** Zero-based index of this snapshot within the run. */
  step: number;
  /** 1-based source line number associated with this step. */
  line: number;
  /** Why this snapshot was captured. */
  event: TraceEvent;
  /** Call stack, outermost (<module>) first, innermost (current) last. */
  stack: StackFrame[];
  /** Standard output accumulated up to and including this step. */
  stdout: string;
  /** Value returned by the frame on a "return" event, if any. */
  returnValue?: ValueNode;
  /**
   * True for the synthetic final-state snapshot appended when a run was
   * truncated but still ran to completion — it shows the end result (module
   * globals) rather than a real traced line.
   */
  final?: boolean;
}

/** A runtime error raised by the user's code. */
export interface ExecutionError {
  /** Exception class name, e.g. "ZeroDivisionError". */
  type: string;
  /** Exception message. */
  message: string;
  /** Source line where the exception occurred, if known. */
  line: number | null;
  /** Formatted traceback string. */
  traceback: string;
}

/** One self-recursive function found by static (AST) analysis. */
export interface RecursionInfo {
  /** Function name. */
  name: string;
  /** How many times it calls itself in its own body (≥2 ⇒ branching). */
  selfCalls: number;
  /** Rough shape of how the argument shrinks toward the base case. */
  shrink: "half" | "decrement" | "other";
}

/**
 * Static-analysis facts about the program, computed in the worker via Python's
 * `ast` module. These DECIDE the complexity class (rules-based, never the LLM —
 * project rule); the classifier maps them to a Big-O string. Null when the
 * source failed to parse.
 */
export interface ComplexityInfo {
  /** Max nesting depth of for/while loops anywhere in the module. */
  maxLoopDepth: number;
  /** Self-recursive functions and their call shape. */
  recursion: RecursionInfo[];
}

/** Full result of running a program through the tracer. */
export interface RunResult {
  snapshots: Snapshot[];
  /** Full program stdout. */
  stdout: string;
  /** Non-null when the program raised an uncaught exception. */
  error: ExecutionError | null;
  /** True when tracing stopped early because the step limit was hit. */
  truncated: boolean;
  /** Wall-clock execution time on the worker, in milliseconds. */
  durationMs: number;
  /** Static loop/recursion facts for complexity analysis; null if unparsable. */
  complexity?: ComplexityInfo | null;
}
