/**
 * JavaScript {@link EntryRunner}: detects a callable entry point in pasted
 * source and synthesizes a driver so LeetCode-style solutions actually execute.
 *
 * Unlike Python, JS functions are commonly assigned to variables — the LeetCode
 * JS template is `var twoSum = function (nums, target) { … }` — so a line scan
 * isn't enough. We parse with acorn (already a dependency for the tracer) and
 * classify each top-level statement: pure definitions (function/class decls and
 * `const f = () => …`) versus anything that actually runs work (a call, a plain
 * variable init, control flow). If nothing runs, we pick an entry to drive.
 *
 * `buildSource` only ever APPENDS a driver, so the user's line numbers still map
 * to the editor; the call itself is constructed here (never hand-editable), so
 * it can't be broken — the user only supplies per-parameter input values.
 */

import { parse } from "acorn";

import type { EntryPoint, EntryRunner, Inputs } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

const DRIVER_HEADER = "// ─── RunX driver (auto-added — edit the inputs below) ───";

/** Parameter names in order, skipping rest params and naming patterns arg{i}. */
function paramNames(params: Node[]): string[] {
  const names: string[] = [];
  params.forEach((p, i) => {
    if (p.type === "Identifier") names.push(p.name);
    else if (p.type === "AssignmentPattern" && p.left.type === "Identifier") names.push(p.left.name);
    else if (p.type === "RestElement") {
      /* skip — variadic */
    } else names.push(`arg${i}`); // destructuring pattern → positional name
  });
  return names;
}

/** First non-constructor instance method of a class, if any. */
function firstMethod(classNode: Node): { name: string; params: string[] } | null {
  for (const el of classNode.body.body) {
    if (
      el.type === "MethodDefinition" &&
      el.kind !== "constructor" &&
      !el.static &&
      el.key &&
      el.key.type === "Identifier"
    ) {
      return { name: el.key.name, params: paramNames(el.value.params) };
    }
  }
  return null;
}

/** Unwrap `export …` so an exported function/class is still seen as a definition. */
function unwrap(stmt: Node): Node {
  if ((stmt.type === "ExportNamedDeclaration" || stmt.type === "ExportDefaultDeclaration") && stmt.declaration) {
    return stmt.declaration;
  }
  return stmt;
}

function parseProgram(code: string): Node | null {
  const opts = { ecmaVersion: "latest" as const };
  try {
    return parse(code, {
      ...opts,
      sourceType: "script",
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
    }) as unknown as Node;
  } catch {
    try {
      return parse(code, { ...opts, sourceType: "module" }) as unknown as Node;
    } catch {
      return null;
    }
  }
}

function detectEntry(code: string): EntryPoint {
  const ast = parseProgram(code);
  // Unparsable → let it run as-is so the worker surfaces the syntax error.
  if (!ast) return { kind: "has-driver", params: [] };

  const funcs: { name: string; params: string[] }[] = [];
  const classes: { name: string; method: string; params: string[] }[] = [];
  let hasDriver = false;

  for (const raw of ast.body) {
    const stmt = unwrap(raw);
    switch (stmt.type) {
      case "FunctionDeclaration":
        if (stmt.id) funcs.push({ name: stmt.id.name, params: paramNames(stmt.params) });
        break;
      case "ClassDeclaration": {
        const method = firstMethod(stmt);
        if (method && stmt.id) classes.push({ name: stmt.id.name, method: method.name, params: method.params });
        break;
      }
      case "ImportDeclaration":
      case "EmptyStatement":
        break;
      case "VariableDeclaration": {
        // Definition only if EVERY declarator initializes a function/arrow;
        // otherwise it executes real work (e.g. `const nums = [...]`).
        const fnDecls = stmt.declarations.filter(
          (d: Node) =>
            d.init && (d.init.type === "FunctionExpression" || d.init.type === "ArrowFunctionExpression")
        );
        if (fnDecls.length > 0 && fnDecls.length === stmt.declarations.length) {
          for (const d of fnDecls) {
            if (d.id.type === "Identifier") funcs.push({ name: d.id.name, params: paramNames(d.init.params) });
          }
        } else {
          hasDriver = true;
        }
        break;
      }
      default:
        // ExpressionStatement, control flow, etc. — the program drives itself.
        hasDriver = true;
    }
  }

  if (hasDriver) return { kind: "has-driver", params: [] };

  const cls = classes.find((c) => c.name === "Solution") ?? classes[0];
  if (cls) {
    return { kind: "class-method", className: cls.name, functionName: cls.method, params: cls.params };
  }
  if (funcs.length > 0) {
    return { kind: "free-function", functionName: funcs[0].name, params: funcs[0].params };
  }
  return { kind: "none", params: [] };
}

function buildSource(code: string, entry: EntryPoint, inputs: Inputs): string {
  if (entry.kind !== "class-method" && entry.kind !== "free-function") {
    return code;
  }

  const assigns = entry.params.map((p) => `const ${p} = ${(inputs[p] ?? "").trim()};`).join("\n");
  const args = entry.params.join(", ");
  const call =
    entry.kind === "class-method"
      ? `new ${entry.className}().${entry.functionName}(${args})`
      : `${entry.functionName}(${args})`;

  const driver = [DRIVER_HEADER, assigns, `console.log(${call});`].filter(Boolean).join("\n");
  return `${code}\n\n\n${driver}\n`;
}

export const javascriptRunner: EntryRunner = {
  language: "javascript",
  detectEntry,
  buildSource,
};
