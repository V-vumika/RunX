/**
 * JavaScript source instrumenter — the front half of the JS tracer.
 *
 * JS has no `sys.settrace` equivalent, so to produce the same per-line trace the
 * Python worker emits we rewrite the source: parse to an ESTree AST (acorn),
 * inject calls to three runtime hooks, and regenerate (astring). The hooks are
 * provided by the JS worker when it runs the instrumented code:
 *
 *   $rx_trace(line, scope)   before every statement — records one Snapshot,
 *                            `scope` is a live object of the accessible locals.
 *   $rx_enter(name, line)    at the top of every function body — pushes a frame.
 *   $rx_exit()               in a finally around the body — pops the frame.
 *
 * Scope handling is TDZ-safe: a name is only put in a trace's `scope` object once
 * it is guaranteed initialized (function params, hoisted var/function names, and
 * let/const/class declared textually earlier in an enclosing block). Anything we
 * can't prove safe is simply omitted — a missing variable in the inspector is
 * fine; a ReferenceError from touching a TDZ binding is not.
 *
 * Instrumentation is pure source→source and never executes user code, so it runs
 * on the main thread; the rewritten code still runs only inside the worker. Any
 * failure returns `{ traced: false }` and the caller falls back to a plain run.
 */

import { parse } from "acorn";
import { generate } from "astring";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

export const TRACE = "$rx_trace";
export const ENTER = "$rx_enter";
export const EXIT = "$rx_exit";

export interface InstrumentResult {
  /** Instrumented source when `traced`, else the original source unchanged. */
  code: string;
  /** True when instrumentation succeeded and the code carries trace hooks. */
  traced: boolean;
  /** Parse/instrument error message when `traced` is false (may be undefined). */
  error?: string;
}

/** Parse `source` (script first, then module) and inject the trace hooks. */
export function instrument(source: string): InstrumentResult {
  let ast: Node;
  try {
    ast = parseFlexible(source);
  } catch (e) {
    return { code: source, traced: false, error: message(e) };
  }
  try {
    const base = new Set<string>(collectHoisted(ast.body));
    ast.body = instrumentStatements(ast.body, base);
    return { code: generate(ast), traced: true };
  } catch (e) {
    return { code: source, traced: false, error: message(e) };
  }
}

function parseFlexible(source: string): Node {
  const opts = { ecmaVersion: "latest" as const, locations: true };
  try {
    return parse(source, {
      ...opts,
      sourceType: "script",
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
    }) as unknown as Node;
  } catch {
    // Retry as a module for code that uses top-level import/export.
    return parse(source, { ...opts, sourceType: "module" }) as unknown as Node;
  }
}

/* ── ESTree node builders ─────────────────────────────────────────────────── */

function id(name: string): Node {
  return { type: "Identifier", name };
}
function lit(value: string | number): Node {
  return { type: "Literal", value };
}
function call(callee: Node, args: Node[]): Node {
  return { type: "CallExpression", callee, arguments: args, optional: false };
}
function exprStmt(expression: Node): Node {
  return { type: "ExpressionStatement", expression };
}
function block(body: Node[]): Node {
  return { type: "BlockStatement", body };
}

/** `$rx_trace(line, { a, b, c })` — the c names are the accessible locals. */
function traceStmt(line: number, names: string[]): Node {
  const properties = names.map((name) => ({
    type: "Property",
    key: id(name),
    value: id(name),
    kind: "init",
    method: false,
    shorthand: true,
    computed: false,
  }));
  return exprStmt(call(id(TRACE), [lit(line), { type: "ObjectExpression", properties }]));
}

/* ── Scope helpers ────────────────────────────────────────────────────────── */

/** Bound identifier names from a binding pattern (handles destructuring). */
function patternNames(pat: Node): string[] {
  if (!pat) return [];
  switch (pat.type) {
    case "Identifier":
      return [pat.name];
    case "ObjectPattern":
      return pat.properties.flatMap((p: Node) =>
        p.type === "RestElement" ? patternNames(p.argument) : patternNames(p.value)
      );
    case "ArrayPattern":
      return pat.elements.filter(Boolean).flatMap((e: Node) => patternNames(e));
    case "AssignmentPattern":
      return patternNames(pat.left);
    case "RestElement":
      return patternNames(pat.argument);
    default:
      return [];
  }
}

/** Names hoisted to a function scope: `var`s and function declarations, not
 *  descending into nested functions/classes (those own their bindings). */
function collectHoisted(stmts: Node[]): string[] {
  const names: string[] = [];
  const visit = (node: Node) => {
    if (!node || typeof node.type !== "string") return;
    switch (node.type) {
      case "VariableDeclaration":
        if (node.kind === "var") {
          for (const d of node.declarations) names.push(...patternNames(d.id));
        }
        return;
      case "FunctionDeclaration":
        if (node.id) names.push(node.id.name);
        return;
      case "FunctionExpression":
      case "ArrowFunctionExpression":
      case "ClassDeclaration":
      case "ClassExpression":
        return;
      default:
        for (const key of Object.keys(node)) {
          if (key === "loc" || key === "start" || key === "end") continue;
          const child = node[key];
          if (Array.isArray(child)) child.forEach(visit);
          else if (child && typeof child.type === "string") visit(child);
        }
    }
  };
  stmts.forEach(visit);
  return names;
}

/** Names a single statement introduces into its enclosing block scope. */
function declaredNames(stmt: Node): string[] {
  switch (stmt.type) {
    case "VariableDeclaration":
      return stmt.declarations.flatMap((d: Node) => patternNames(d.id));
    case "FunctionDeclaration":
    case "ClassDeclaration":
      return stmt.id ? [stmt.id.name] : [];
    default:
      return [];
  }
}

/* ── The transform ────────────────────────────────────────────────────────── */

/** Inject a trace before each statement; grow the accessible set as we pass
 *  declarations (so a name is only traced once it is safely initialized). */
function instrumentStatements(stmts: Node[], accessible: Set<string>): Node[] {
  const local = new Set(accessible);
  const out: Node[] = [];
  for (const stmt of stmts) {
    const line = stmt.loc ? stmt.loc.start.line : 0;
    out.push(traceStmt(line, [...local]));
    instrumentStatement(stmt, local);
    for (const name of declaredNames(stmt)) local.add(name);
    out.push(stmt);
  }
  return out;
}

/** Turn a loop/if body into an instrumented block (wrapping a bare statement). */
function asBlock(body: Node, accessible: Set<string>): Node {
  const stmts = body.type === "BlockStatement" ? body.body : [body];
  return block(instrumentStatements(stmts, accessible));
}

/** Recurse into a statement's nested bodies and any functions in its exprs. */
function instrumentStatement(stmt: Node, accessible: Set<string>): void {
  switch (stmt.type) {
    case "BlockStatement":
      stmt.body = instrumentStatements(stmt.body, accessible);
      return;
    case "IfStatement":
      instrumentExpressions(stmt.test, accessible);
      stmt.consequent = asBlock(stmt.consequent, accessible);
      if (stmt.alternate) {
        if (stmt.alternate.type === "IfStatement") instrumentStatement(stmt.alternate, accessible);
        else stmt.alternate = asBlock(stmt.alternate, accessible);
      }
      return;
    case "ForStatement": {
      const inner = new Set(accessible);
      if (stmt.init) {
        if (stmt.init.type === "VariableDeclaration") {
          for (const d of stmt.init.declarations) for (const n of patternNames(d.id)) inner.add(n);
          instrumentExpressions(stmt.init, accessible);
        } else {
          instrumentExpressions(stmt.init, accessible);
        }
      }
      if (stmt.test) instrumentExpressions(stmt.test, inner);
      if (stmt.update) instrumentExpressions(stmt.update, inner);
      stmt.body = asBlock(stmt.body, inner);
      return;
    }
    case "ForOfStatement":
    case "ForInStatement": {
      const inner = new Set(accessible);
      if (stmt.left.type === "VariableDeclaration") {
        for (const d of stmt.left.declarations) for (const n of patternNames(d.id)) inner.add(n);
      }
      instrumentExpressions(stmt.right, accessible);
      stmt.body = asBlock(stmt.body, inner);
      return;
    }
    case "WhileStatement":
    case "DoWhileStatement":
      instrumentExpressions(stmt.test, accessible);
      stmt.body = asBlock(stmt.body, accessible);
      return;
    case "TryStatement":
      stmt.block = block(instrumentStatements(stmt.block.body, accessible));
      if (stmt.handler) {
        const inner = new Set(accessible);
        if (stmt.handler.param) for (const n of patternNames(stmt.handler.param)) inner.add(n);
        stmt.handler.body = block(instrumentStatements(stmt.handler.body.body, inner));
      }
      if (stmt.finalizer) stmt.finalizer = block(instrumentStatements(stmt.finalizer.body, accessible));
      return;
    case "SwitchStatement":
      instrumentExpressions(stmt.discriminant, accessible);
      for (const c of stmt.cases) {
        if (c.test) instrumentExpressions(c.test, accessible);
        c.consequent = instrumentStatements(c.consequent, accessible);
      }
      return;
    case "LabeledStatement":
      instrumentStatement(stmt.body, accessible);
      return;
    case "FunctionDeclaration":
      visitFunction(stmt, accessible);
      return;
    case "ClassDeclaration":
      instrumentClass(stmt, accessible);
      return;
    case "ExportNamedDeclaration":
    case "ExportDefaultDeclaration":
      if (stmt.declaration) instrumentStatement(stmt.declaration, accessible);
      return;
    default:
      // VariableDeclaration / ExpressionStatement / Return / Throw / … — only
      // their expressions can hold functions to instrument.
      instrumentExpressions(stmt, accessible);
  }
}

/** Walk an expression subtree, instrumenting any functions/classes found. */
function instrumentExpressions(node: Node, accessible: Set<string>): void {
  if (!node || typeof node.type !== "string") return;
  switch (node.type) {
    case "FunctionExpression":
    case "ArrowFunctionExpression":
    case "FunctionDeclaration":
      visitFunction(node, accessible);
      return;
    case "ClassExpression":
    case "ClassDeclaration":
      instrumentClass(node, accessible);
      return;
    default:
      for (const key of Object.keys(node)) {
        if (key === "loc" || key === "start" || key === "end") continue;
        const child = node[key];
        if (Array.isArray(child)) child.forEach((c) => instrumentExpressions(c, accessible));
        else if (child && typeof child.type === "string") instrumentExpressions(child, accessible);
      }
  }
}

function instrumentClass(node: Node, accessible: Set<string>): void {
  for (const el of node.body.body) {
    if (!el.value) continue;
    const hint = el.key && el.key.type === "Identifier" ? el.key.name : undefined;
    if (el.value.type === "FunctionExpression" || el.value.type === "ArrowFunctionExpression") {
      visitFunction(el.value, accessible, hint);
    } else {
      instrumentExpressions(el.value, accessible);
    }
  }
}

/** Instrument a function body: capture the closure scope, add params + hoisted
 *  names, inject enter/trace calls, and pop the frame in a finally. */
function visitFunction(fn: Node, closureBase: Set<string>, nameHint?: string): void {
  const inner = new Set(closureBase);
  for (const p of fn.params) {
    for (const n of patternNames(p)) inner.add(n);
    instrumentExpressions(p, closureBase); // default-value expressions
  }

  let bodyStmts: Node[];
  if (fn.body.type === "BlockStatement") {
    for (const n of collectHoisted(fn.body.body)) inner.add(n);
    bodyStmts = fn.body.body;
  } else {
    // Concise arrow body `() => expr` → `() => { return expr; }`.
    bodyStmts = [{ type: "ReturnStatement", argument: fn.body, loc: fn.body.loc }];
    fn.body = block(bodyStmts);
  }

  const name = (fn.id && fn.id.name) || nameHint || "<anonymous>";
  const line = fn.loc ? fn.loc.start.line : 0;
  const instrumented = instrumentStatements(bodyStmts, inner);

  fn.body.body = [
    exprStmt(call(id(ENTER), [lit(name), lit(line)])),
    {
      type: "TryStatement",
      block: block(instrumented),
      handler: null,
      finalizer: block([exprStmt(call(id(EXIT), []))]),
    },
  ];
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
