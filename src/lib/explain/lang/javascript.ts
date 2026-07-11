/**
 * JavaScript {@link LanguageProfile} + rules-based static complexity analyzer.
 *
 * Python's ComplexityInfo facts come from a real AST pass inside the Pyodide
 * worker. JavaScript has no tracer yet (Phase 9), and a full JS parser is an
 * ask-first dependency — so this is a light lexical scanner in the same spirit
 * as the worker's Python analyzer, and with the same rules:
 *
 *   - maxLoopDepth counts only *scaling* loops (a `for` bounded by integer
 *     literals or iterating a literal adds O(1) and must not inflate the
 *     class; `while` can't be proven constant, so it always counts),
 *   - recursion reports each self-calling function with its call count and a
 *     rough shrink shape (half / decrement / other).
 *
 * The scan works on a sanitized copy of the source (comments and string /
 * template-literal contents blanked, length preserved) so braces or keywords
 * inside strings can't fool it. It is deliberately heuristic — a rare miss on
 * exotic code (regex literals containing braces, `else` continuing a braceless
 * loop body) is acceptable; the shapes students paste are covered.
 */

import type { ComplexityInfo, RecursionInfo } from "@/types/snapshot";
import type { LanguageProfile } from "./types";

/**
 * Blank out comments and string/template-literal contents, preserving overall
 * length, newlines, and the quote characters themselves — so indices stay
 * stable and delimiter matching can't be fooled by contents.
 */
export function sanitize(code: string): string {
  let out = "";
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    const next = code[i + 1];
    if (c === "/" && next === "/") {
      while (i < n && code[i] !== "\n") { out += " "; i++; }
      continue;
    }
    if (c === "/" && next === "*") {
      out += "  "; i += 2;
      while (i < n && !(code[i] === "*" && code[i + 1] === "/")) {
        out += code[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < n) { out += "  "; i += 2; }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      out += c; i++;
      while (i < n && code[i] !== c) {
        if (code[i] === "\\") { out += "  "; i += 2; continue; }
        out += code[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < n) { out += c; i++; }
      continue;
    }
    out += c; i++;
  }
  return out;
}

/** Index of the delimiter closing the one at `openIdx` (or end of source). */
function matchDelim(src: string, openIdx: number, open: string, close: string): number {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return src.length;
}

// ── loop nesting ─────────────────────────────────────────────────────────────

/**
 * A classic `for` is constant (non-scaling) only when both the init and the
 * condition are bound by integer literals — `for (let i = 0; i < 10; i++)`.
 * `for (let i = n; i > 0; i--)` starts at n, so it scales. A `for…of`/`for…in`
 * over a literal array/string is constant; over a variable it scales.
 */
function forHeaderScales(header: string): boolean {
  if (header.includes(";")) {
    const parts = header.split(";");
    const init = (parts[0] ?? "").trim();
    const cond = (parts[1] ?? "").trim();
    if (cond === "") return true; // for(;;)
    const initLiteral = /=\s*[+-]?\d+\s*$/.test(init);
    const condLiteral =
      /[<>]=?\s*[+-]?\d+\s*$/.test(cond) || /^[+-]?\d+\s*[<>]=?/.test(cond);
    return !(initLiteral && condLiteral);
  }
  const m = header.match(/\b(?:of|in)\b([\s\S]*)/);
  if (m) {
    const iter = m[1].trim();
    return !(iter.startsWith("[") || /^["'`]/.test(iter));
  }
  return true;
}

/** Max nesting depth of scaling loops. `src` must already be sanitized. */
function maxJsLoopDepth(src: string): number {
  const n = src.length;
  let i = 0;
  let max = 0;
  let parenDepth = 0;
  let scalingOpen = 0;
  /** One tag per open `{`; "loop" entries are scaling-loop bodies. */
  const braceTags: ("loop" | "plain")[] = [];
  /** Brace depth at which each braceless scaling loop was opened. */
  const braceless: number[] = [];

  // A braceless loop's body is a single statement: it ends at a `;` at the
  // loop's own depth, or when a block closes back down to (or past) it.
  const closeBracelessFrom = (depth: number) => {
    while (braceless.length && braceless[braceless.length - 1] >= depth) {
      braceless.pop();
      scalingOpen--;
    }
  };

  while (i < n) {
    const c = src[i];

    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[\w$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      i = j;
      if (word !== "for" && word !== "while" && word !== "do") continue;

      // Consume the (…) header; `do` has none. `while` (incl. the tail of a
      // do…while) is treated as scaling — a constant bound can't be proven.
      let scaling = true;
      if (word !== "do") {
        let k = i;
        while (k < n && /\s/.test(src[k])) k++;
        if (src[k] !== "(") continue; // not a loop header after all
        const close = matchDelim(src, k, "(", ")");
        if (word === "for") scaling = forHeaderScales(src.slice(k + 1, close));
        i = close + 1;
      }

      // Body: a braced block, or a single braceless statement.
      let k = i;
      while (k < n && /\s/.test(src[k])) k++;
      if (src[k] === "{") {
        braceTags.push(scaling ? "loop" : "plain");
        if (scaling) {
          scalingOpen++;
          if (scalingOpen > max) max = scalingOpen;
        }
        i = k + 1;
      } else if (scaling) {
        scalingOpen++;
        if (scalingOpen > max) max = scalingOpen;
        braceless.push(braceTags.length);
      }
      continue;
    }

    if (c === "(") { parenDepth++; i++; continue; }
    if (c === ")") { if (parenDepth > 0) parenDepth--; i++; continue; }
    if (c === "{") { braceTags.push("plain"); i++; continue; }
    if (c === "}") {
      if (braceTags.pop() === "loop") scalingOpen--;
      closeBracelessFrom(braceTags.length);
      i++;
      continue;
    }
    if (c === ";" && parenDepth === 0) {
      closeBracelessFrom(braceTags.length);
      i++;
      continue;
    }
    i++;
  }
  return max;
}

// ── function declarations & recursion ────────────────────────────────────────

interface FnDecl {
  name: string;
  /** Body text (block contents, or an arrow's expression body). */
  body: string;
}

/** Names METHOD_RE must never treat as a method (control-flow headers etc.). */
const NON_METHOD_NAMES = new Set([
  "if", "for", "while", "switch", "catch", "function", "return", "else",
  "do", "try", "new", "typeof", "delete", "void", "in", "of", "instanceof",
  "with", "constructor", "await", "yield",
]);

const FUNC_DECL_RE = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;
const VAR_FN_RE = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\b[^(]*\(/g;
const VAR_ARROW_RE = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^()]*\)|[A-Za-z_$][\w$]*)\s*=>/g;
/** Class/object method: `name(params) {` at a statement boundary. */
const METHOD_RE = /(^|[{};])\s*(?:static\s+)?([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*\{/g;

/** Find function declarations and their bodies. `src` must be sanitized. */
function findDeclarations(src: string): FnDecl[] {
  const out: FnDecl[] = [];
  const bodyStarts = new Set<number>();

  const pushBlockBody = (name: string, braceIdx: number) => {
    if (src[braceIdx] !== "{" || bodyStarts.has(braceIdx)) return;
    bodyStarts.add(braceIdx);
    const end = matchDelim(src, braceIdx, "{", "}");
    out.push({ name, body: src.slice(braceIdx + 1, end) });
  };

  const skipWs = (from: number) => {
    let i = from;
    while (i < src.length && /\s/.test(src[i])) i++;
    return i;
  };

  for (const m of src.matchAll(FUNC_DECL_RE)) {
    const parenOpen = m.index + m[0].length - 1;
    pushBlockBody(m[1], skipWs(matchDelim(src, parenOpen, "(", ")") + 1));
  }
  for (const m of src.matchAll(VAR_FN_RE)) {
    const parenOpen = m.index + m[0].length - 1;
    pushBlockBody(m[1], skipWs(matchDelim(src, parenOpen, "(", ")") + 1));
  }
  for (const m of src.matchAll(VAR_ARROW_RE)) {
    const after = skipWs(m.index + m[0].length);
    if (src[after] === "{") {
      pushBlockBody(m[1], after);
    } else {
      // Expression body: runs to the terminating `;` at delimiter depth 0.
      let i = after;
      let depth = 0;
      while (i < src.length) {
        const c = src[i];
        if (c === "(" || c === "[" || c === "{") depth++;
        else if (c === ")" || c === "]" || c === "}") depth--;
        else if (c === ";" && depth === 0) break;
        i++;
      }
      out.push({ name: m[1], body: src.slice(after, i) });
    }
  }
  for (const m of src.matchAll(METHOD_RE)) {
    const name = m[2];
    if (NON_METHOD_NAMES.has(name)) continue;
    pushBlockBody(name, m.index + m[0].length - 1);
  }
  return out;
}

/** Names of the functions defined in the source (deduped, in order). */
export function definedJsFunctions(code: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const d of findDeclarations(sanitize(code))) {
    if (!seen.has(d.name)) {
      seen.add(d.name);
      names.push(d.name);
    }
  }
  return names;
}

/** Rough shrink shape of a self-call from its argument text (half wins). */
function shrinkOf(args: string, current: RecursionInfo["shrink"]): RecursionInfo["shrink"] {
  if (/\/\s*2\b|>>\s*1\b|\bmid\b|half/i.test(args)) return "half";
  if (current !== "half" && /-\s*\d|--/.test(args)) return "decrement";
  return current;
}

/** Static loop/recursion facts for JavaScript source (never throws). */
export function analyzeJsComplexity(code: string): ComplexityInfo {
  const src = sanitize(code);

  const recursion: RecursionInfo[] = [];
  const reported = new Set<string>();
  for (const decl of findDeclarations(src)) {
    if (reported.has(decl.name)) continue;
    const callRe = new RegExp("\\b" + decl.name.replace(/\$/g, "\\$") + "\\s*\\(", "g");
    let selfCalls = 0;
    let shrink: RecursionInfo["shrink"] = "other";
    for (const call of decl.body.matchAll(callRe)) {
      selfCalls++;
      const open = decl.body.indexOf("(", call.index + decl.name.length - 1);
      const close = matchDelim(decl.body, open, "(", ")");
      shrink = shrinkOf(decl.body.slice(open + 1, close), shrink);
    }
    if (selfCalls > 0) {
      reported.add(decl.name);
      recursion.push({ name: decl.name, selfCalls, shrink });
    }
  }

  return { maxLoopDepth: maxJsLoopDepth(src), recursion };
}

export const javascriptProfile: LanguageProfile = {
  language: "javascript",
  scriptTitle: "JavaScript program",
  definedFunctions: definedJsFunctions,
  fallbackLoopNesting: (code) => maxJsLoopDepth(sanitize(code)),
  // No heapq in JS — a hand-rolled heap / priority queue goes by these names.
  usesHeap: (code) => /\b(?:heap\w*|priority\s*_?queue|pq)\b/i.test(code),
  // Midpoint idioms: integer halving or a shift by one.
  halvesRange: (code) => /\/\s*2\b|>>\s*1\b/.test(code),
  analyzeComplexity: analyzeJsComplexity,
};
