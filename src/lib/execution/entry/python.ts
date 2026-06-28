/**
 * Python {@link EntryRunner}: detects a callable entry point in pasted source
 * and synthesizes a driver so LeetCode-style solutions actually execute.
 *
 * Detection is intentionally a light line scanner, not a full parser — it works
 * off indentation (top-level = column 0) and `def`/`class` keywords. That covers
 * the shapes students paste; anything it misses still runs, because the user can
 * write the driver block by hand.
 */

import type { EntryPoint, EntryRunner, Inputs } from "./types";

const DRIVER_HEADER = "# ─── RunX driver (auto-added — edit the inputs below) ───";

/** Dunder/private methods we never treat as the entry point. */
const SKIP_METHODS = /^(__\w+__|_)/;

/** Split a parameter list, then strip annotations, defaults, and self/cls. */
function parseParams(rawSignature: string): string[] {
  return rawSignature
    .split(",")
    .map((p) => p.trim())
    // drop *args / **kwargs and bare empties
    .filter((p) => p.length > 0 && !p.startsWith("*"))
    // name is everything before a ':' (annotation) or '=' (default)
    .map((p) => p.split(/[:=]/)[0].trim())
    .filter((p) => p.length > 0 && p !== "self" && p !== "cls");
}

/**
 * Read a `def name(...)` signature starting at `lines[i]`, spanning lines until
 * parentheses balance. Returns the function name and its parameter names.
 */
function readDef(
  lines: string[],
  i: number
): { name: string; params: string[] } | null {
  const head = lines[i];
  const m = head.match(/\bdef\s+([A-Za-z_]\w*)\s*\(/);
  if (!m) return null;

  // Accumulate text from the first '(' until parens balance.
  let depth = 0;
  let started = false;
  let inside = "";
  for (let j = i; j < lines.length; j++) {
    for (const ch of lines[j]) {
      if (ch === "(") {
        depth++;
        started = true;
        if (depth === 1) continue; // skip the opening paren itself
      } else if (ch === ")") {
        depth--;
        if (depth === 0) {
          return { name: m[1], params: parseParams(inside) };
        }
      }
      if (started && depth >= 1) inside += ch;
    }
    inside += " ";
  }
  return { name: m[1], params: parseParams(inside) };
}

/** Indentation (leading spaces, tabs counted as 1) of a line. */
function indentOf(line: string): number {
  const m = line.match(/^[ \t]*/);
  return m ? m[0].length : 0;
}

/** Does this top-level line execute something (vs. just define/import)? */
function isDriverStatement(line: string): boolean {
  const t = line.trim();
  if (t === "") return false;
  if (t.startsWith("#")) return false;
  if (t.startsWith("@")) return false; // decorator
  if (/^(def|class|import|from|global|nonlocal)\b/.test(t)) return false;
  return true;
}

function detectEntry(code: string): EntryPoint {
  const lines = code.split("\n");

  // 1. Any top-level executable statement (incl. `if __name__ == "__main__":`)
  //    means the program already drives itself.
  for (const line of lines) {
    if (indentOf(line) === 0 && isDriverStatement(line)) {
      return { kind: "has-driver", params: [] };
    }
  }

  // 2. Look for a class with a usable method. Prefer one named `Solution`.
  type ClassHit = { name: string; method: string; params: string[] };
  let firstClass: ClassHit | null = null;
  let solutionClass: ClassHit | null = null;

  for (let i = 0; i < lines.length; i++) {
    const cm = lines[i].match(/^class\s+([A-Za-z_]\w*)/);
    if (!cm || indentOf(lines[i]) !== 0) continue;
    const className = cm[1];

    // Scan the class body (more-indented lines) for the first real method.
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === "") continue;
      if (indentOf(lines[j]) === 0) break; // class body ended
      if (/^\s*def\s/.test(lines[j])) {
        const def = readDef(lines, j);
        if (def && !SKIP_METHODS.test(def.name)) {
          const found = {
            name: className,
            method: def.name,
            params: def.params,
          };
          if (className === "Solution" && !solutionClass) solutionClass = found;
          if (!firstClass) firstClass = found;
          break;
        }
      }
    }
  }

  const cls = solutionClass ?? firstClass;
  if (cls) {
    return {
      kind: "class-method",
      className: cls.name,
      functionName: cls.method,
      params: cls.params,
    };
  }

  // 3. A top-level function nothing calls.
  for (let i = 0; i < lines.length; i++) {
    if (indentOf(lines[i]) === 0 && /^def\s/.test(lines[i])) {
      const def = readDef(lines, i);
      if (def) {
        return {
          kind: "free-function",
          functionName: def.name,
          params: def.params,
        };
      }
    }
  }

  return { kind: "none", params: [] };
}

function buildSource(code: string, entry: EntryPoint, inputs: Inputs): string {
  if (entry.kind !== "class-method" && entry.kind !== "free-function") {
    return code;
  }

  const assigns = entry.params
    .map((p) => `${p} = ${(inputs[p] ?? "").trim()}`)
    .join("\n");
  const args = entry.params.join(", ");
  const call =
    entry.kind === "class-method"
      ? `${entry.className}().${entry.functionName}(${args})`
      : `${entry.functionName}(${args})`;

  const driver = [DRIVER_HEADER, assigns, `print(${call})`]
    .filter(Boolean)
    .join("\n");
  return `${code}\n\n\n${driver}\n`;
}

export const pythonRunner: EntryRunner = {
  language: "python",
  detectEntry,
  buildSource,
};
