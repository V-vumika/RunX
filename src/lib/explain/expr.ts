/**
 * Expression-level value substitution (Phase 5.1).
 *
 * Beginners can't mentally resolve `arr[i-1] + 1` → `2`. This evaluates the
 * sub-expressions on a line against the values we ALREADY captured for that
 * step (the `ValueNode` locals), so we can show `arr[i] = 2`, `arr[i-1] = 1`,
 * `arr[i-1] + 1 = 2`, etc.
 *
 * Crucially it reads only the serialized snapshot data — it never re-executes
 * Python — so there is no risk of double-running a side-effecting call. Function
 * calls are limited to a few pure builtins (len/min/max/abs/sum); anything it
 * can't resolve is silently skipped. Any parse/eval error yields no output.
 */

import type { ValueNode } from "@/types/snapshot";

export interface SubExpr {
  /** The source text of the sub-expression, e.g. "arr[i-1] + 1". */
  name: string;
  /** Its resolved value, e.g. "2". */
  repr: string;
}

// ── evaluated value ─────────────────────────────────────────────────────────
interface V {
  repr: string;
  num?: number;
  str?: string;
  bool?: boolean;
  node?: ValueNode;
  none?: boolean;
}

function fromNode(node: ValueNode): V {
  switch (node.kind) {
    case "int":
    case "float":
      return { repr: node.repr, num: Number(node.value) };
    case "str":
      return { repr: node.repr, str: typeof node.value === "string" ? node.value : node.repr.replace(/^['"]|['"]$/g, "") };
    case "bool":
      return { repr: node.repr, bool: node.value === true };
    case "none":
      return { repr: "None", none: true };
    default:
      return { repr: node.repr, node };
  }
}

function numV(n: number): V {
  return { repr: Number.isInteger(n) ? String(n) : String(+n.toFixed(4)), num: n };
}
function boolV(b: boolean): V {
  return { repr: b ? "True" : "False", bool: b };
}

// ── tokenizer ───────────────────────────────────────────────────────────────
interface Tok { t: string; v: string; s: number; e: number }
const MULTI = ["**", "//", "<=", ">=", "==", "!="];
const SINGLE = "+-*/%()[],.<>=";

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t") { i++; continue; }
    if (c === "'" || c === '"') {
      const start = i; i++;
      while (i < src.length && src[i] !== c) i++;
      i++;
      out.push({ t: "str", v: src.slice(start, i), s: start, e: i });
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      const start = i;
      while (i < src.length && /[0-9.]/.test(src[i])) i++;
      out.push({ t: "num", v: src.slice(start, i), s: start, e: i });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const start = i;
      while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) i++;
      out.push({ t: "name", v: src.slice(start, i), s: start, e: i });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (MULTI.includes(two)) { out.push({ t: "op", v: two, s: i, e: i + 2 }); i += 2; continue; }
    if (SINGLE.includes(c)) { out.push({ t: "op", v: c, s: i, e: i + 1 }); i++; continue; }
    // unknown char → bail by throwing
    throw new Error("unexpected char");
  }
  return out;
}

// ── parser + evaluator (eval as we parse) ───────────────────────────────────
class Ev {
  pos = 0;
  collected = new Map<string, string>();
  constructor(private toks: Tok[], private src: string, private scope: Map<string, ValueNode>) {}

  private peek() { return this.toks[this.pos]; }
  private eat(v?: string) {
    const t = this.toks[this.pos];
    if (!t || (v !== undefined && t.v !== v)) throw new Error("parse");
    this.pos++;
    return t;
  }
  private record(start: number, end: number, v: V) {
    const text = this.src.slice(start, end).trim();
    if (text) this.collected.set(text, v.repr);
  }

  parse(): void {
    this.or();
    if (this.pos < this.toks.length) throw new Error("trailing");
  }

  private or(): V {
    let v = this.and();
    while (this.peek()?.v === "or") { this.eat(); const b = this.and(); v = boolV(truthy(v) || truthy(b)); }
    return v;
  }
  private and(): V {
    let v = this.cmp();
    while (this.peek()?.v === "and") { this.eat(); const b = this.cmp(); v = boolV(truthy(v) && truthy(b)); }
    return v;
  }
  private cmp(): V {
    const start = this.peek()?.s ?? 0;
    let v = this.add();
    while (["<", "<=", ">", ">=", "==", "!="].includes(this.peek()?.v)) {
      const op = this.eat().v;
      const b = this.add();
      const end = this.toks[this.pos - 1].e;
      v = boolV(compare(v, op, b));
      this.record(start, end, v);
    }
    return v;
  }
  private add(): V {
    const start = this.peek()?.s ?? 0;
    let v = this.mul();
    while (["+", "-"].includes(this.peek()?.v)) {
      const op = this.eat().v;
      const b = this.mul();
      v = op === "+" ? plus(v, b) : numV(num(v) - num(b));
      this.record(start, this.toks[this.pos - 1].e, v);
    }
    return v;
  }
  private mul(): V {
    const start = this.peek()?.s ?? 0;
    let v = this.unary();
    while (["*", "/", "//", "%"].includes(this.peek()?.v)) {
      const op = this.eat().v;
      const b = this.unary();
      const x = num(v), y = num(b);
      v = numV(op === "*" ? x * y : op === "/" ? x / y : op === "//" ? Math.floor(x / y) : x % y);
      this.record(start, this.toks[this.pos - 1].e, v);
    }
    return v;
  }
  private unary(): V {
    if (this.peek()?.v === "-") { this.eat(); return numV(-num(this.unary())); }
    if (this.peek()?.v === "+") { this.eat(); return this.unary(); }
    if (this.peek()?.v === "not") { this.eat(); return boolV(!truthy(this.unary())); }
    return this.power();
  }
  private power(): V {
    const v = this.postfix();
    if (this.peek()?.v === "**") { this.eat(); const e = this.unary(); return numV(Math.pow(num(v), num(e))); }
    return v;
  }
  private postfix(): V {
    const start = this.peek()?.s ?? 0;
    let v = this.primary();
    for (;;) {
      const p = this.peek();
      if (p?.v === "[") {
        this.eat("[");
        const idx = this.or();
        this.eat("]");
        v = subscript(v, idx);
        this.record(start, this.toks[this.pos - 1].e, v);
      } else if (p?.v === ".") {
        this.eat(".");
        const name = this.eat().v;
        v = attr(v, name);
        this.record(start, this.toks[this.pos - 1].e, v);
      } else break;
    }
    return v;
  }
  private primary(): V {
    const t = this.peek();
    if (!t) throw new Error("eof");
    if (t.t === "num") { this.eat(); return numV(Number(t.v)); }
    if (t.t === "str") { this.eat(); return { repr: t.v, str: t.v.slice(1, -1) }; }
    if (t.v === "(") { this.eat("("); const v = this.or(); this.eat(")"); return v; }
    if (t.v === "[") {
      // list literal: evaluate items (best-effort) but return as opaque
      this.eat("[");
      const items: V[] = [];
      if (this.peek()?.v !== "]") {
        items.push(this.or());
        while (this.peek()?.v === ",") { this.eat(","); if (this.peek()?.v === "]") break; items.push(this.or()); }
      }
      this.eat("]");
      return { repr: `[${items.map((x) => x.repr).join(", ")}]` };
    }
    if (t.t === "name") {
      this.eat();
      if (t.v === "True") return boolV(true);
      if (t.v === "False") return boolV(false);
      if (t.v === "None") return { repr: "None", none: true };
      // builtin call?
      if (this.peek()?.v === "(") return this.call(t);
      const node = this.scope.get(t.v);
      if (!node) throw new Error("unknown name");
      const v = fromNode(node);
      this.record(t.s, t.e, v);
      return v;
    }
    throw new Error("primary");
  }
  private call(nameTok: Tok): V {
    this.eat("(");
    const args: V[] = [];
    if (this.peek()?.v !== ")") {
      args.push(this.or());
      while (this.peek()?.v === ",") { this.eat(","); args.push(this.or()); }
    }
    this.eat(")");
    const end = this.toks[this.pos - 1].e;
    const v = builtin(nameTok.v, args);
    this.record(nameTok.s, end, v);
    return v;
  }
}

// ── value operations ────────────────────────────────────────────────────────
function num(v: V): number {
  if (v.num !== undefined) return v.num;
  if (v.bool !== undefined) return v.bool ? 1 : 0;
  throw new Error("not a number");
}
function truthy(v: V): boolean {
  if (v.bool !== undefined) return v.bool;
  if (v.num !== undefined) return v.num !== 0;
  if (v.none) return false;
  if (v.str !== undefined) return v.str.length > 0;
  if (v.node) return (v.node.length ?? v.node.items?.length ?? v.node.entries?.length ?? 1) > 0;
  return true;
}
function plus(a: V, b: V): V {
  if (a.str !== undefined && b.str !== undefined) return { repr: `'${a.str}${b.str}'`, str: a.str + b.str };
  return numV(num(a) + num(b));
}
function compare(a: V, op: string, b: V): boolean {
  const x = a.str !== undefined && b.str !== undefined ? a.str : num(a);
  const y = a.str !== undefined && b.str !== undefined ? b.str : num(b);
  switch (op) {
    case "<": return x < y;
    case "<=": return x <= y;
    case ">": return x > y;
    case ">=": return x >= y;
    case "==": return x === y;
    case "!=": return x !== y;
  }
  return false;
}
function subscript(base: V, idx: V): V {
  const node = base.node;
  if (node && (node.kind === "list" || node.kind === "tuple" || node.kind === "deque")) {
    let i = num(idx);
    const items = node.items ?? [];
    if (i < 0) i += items.length;
    const it = items[i];
    if (!it) throw new Error("index");
    return fromNode(it);
  }
  if (node && node.kind === "dict") {
    const key = idx.str !== undefined ? `'${idx.str}'` : idx.repr;
    const e = (node.entries ?? []).find((en) => en.key.repr === key || en.key.repr === String(idx.num));
    if (!e) throw new Error("key");
    return fromNode(e.value);
  }
  if (base.str !== undefined) {
    let i = num(idx);
    const s = base.str;
    if (i < 0) i += s.length;
    const ch = s[i];
    if (ch === undefined) throw new Error("index");
    return { repr: `'${ch}'`, str: ch };
  }
  throw new Error("not subscriptable");
}
function attr(base: V, name: string): V {
  const node = base.node;
  const a = node?.attributes?.find((x) => x.name === name);
  if (!a) throw new Error("attr");
  return fromNode(a.value);
}
function builtin(name: string, args: V[]): V {
  switch (name) {
    case "len": {
      const n = args[0]?.node;
      if (n) return numV(n.length ?? n.items?.length ?? n.entries?.length ?? 0);
      if (args[0]?.str !== undefined) return numV(args[0].str.length);
      throw new Error("len");
    }
    case "abs": return numV(Math.abs(num(args[0])));
    case "min": return numV(Math.min(...listNums(args)));
    case "max": return numV(Math.max(...listNums(args)));
    case "sum": return numV(listNums(args).reduce((s, x) => s + x, 0));
    default: throw new Error("unsupported call");
  }
}
function listNums(args: V[]): number[] {
  if (args.length === 1 && args[0].node?.items) {
    return args[0].node.items.map((it) => Number(it.value));
  }
  return args.map(num);
}

// ── public entry ────────────────────────────────────────────────────────────

/** Extract the primary expression from a statement line (RHS / condition / iterable). */
function expressionFromLine(line: string): string | null {
  const t = line.trim();
  if (!t || t.startsWith("#")) return null;
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^return\s+(.+)$/))) return m[1];
  if ((m = t.match(/^(?:if|elif|while)\s+(.+?):?\s*$/))) return m[1];
  if ((m = t.match(/^for\s+.+?\s+in\s+(.+?):?\s*$/))) return m[1];
  // assignment (plain or augmented) → right-hand side
  if (!/^(def|class|import|from|for|while|if|elif|else|try|except|with|return)\b/.test(t)) {
    m = t.match(/^[\w.[\]]+\s*(?:[+\-*/%]|\/\/|\*\*)?=(?!=)\s*(.+)$/);
    if (m) return m[1];
  }
  return t; // bare expression / call
}

/**
 * Resolve the sub-expressions on `src` against `scope` (the frame's live values).
 * Returns them in source order, most-composite last, capped for display.
 */
export function evaluateLine(src: string | undefined, scope: Map<string, ValueNode>): SubExpr[] {
  if (!src) return [];
  const expr = expressionFromLine(src);
  if (!expr) return [];
  try {
    const ev = new Ev(tokenize(expr), expr, scope);
    ev.parse();
    const out: SubExpr[] = [];
    for (const [name, repr] of ev.collected) out.push({ name, repr });
    return out.slice(0, 8);
  } catch {
    return [];
  }
}
