# How complexity classification works

Complexity **class** is always rules-based — never an LLM guess. This is a
standing project rule (see `CLAUDE.md`); the classifier
(`src/lib/explain/classify.ts`) is the single source of truth, shared by both
languages.

## Inputs

- **Static facts** (`ComplexityInfo`, from an AST pass): max loop-nesting
  depth, and a `RecursionInfo` per recursive function (how many times it
  calls itself per invocation — `selfCalls` — and whether its argument
  `shrink`s by `"half"` or `"decrement"` each call). Python's comes from the
  Pyodide worker's `ast` pass; JavaScript's from the static analyzer in
  `src/lib/explain/lang/javascript.ts`.
- **Runtime facts** (from the actual trace): recursion depth observed,
  whether a swap happened (sort detection), structure shapes seen (trie/tree/
  etc.).

## The rules (`src/lib/explain/classify.ts`)

**Loop nesting** (`complexityFromLoops`):
| Nesting | Class |
|---|---|
| 0 | O(1) |
| 1 | O(n) |
| 2 | O(n²) |
| ≥3 | O(n³) |

**Recursion shape** (`recursionComplexity`), checked in this order:
1. `selfCalls ≥ 2` and shrinks by half → **O(n log n)** (divide and conquer)
2. `selfCalls ≥ 2` → **O(2ⁿ)** (exponential branching)
3. shrinks by half → **O(log n)**
4. shrinks by decrement → **O(n)**
5. Name-based fallback only if none of the above matched: `fib*` → O(2ⁿ),
   `fact*` → O(n)
6. Otherwise → O(n), linear in the observed recursion depth

The loop-based and recursion-based results are combined by
`classifyProgram`, which also decides the `AlgoKind` (sort / binary-search /
tree / trie / etc.) so the Explain panel can pick a visualizer and write a
one-line summary. The LLM (currently unwired — see `CLAUDE.md`) would only
ever be allowed to write prose on top of these already-decided facts.
