/**
 * Pre-flight support check.
 *
 * RunX executes Python in a Pyodide Web Worker — a real CPython, but sandboxed:
 * no stdin, no network, only an in-memory filesystem, no OS threads. Some code
 * therefore hangs (e.g. `input()` blocks forever waiting on stdin) or fails in
 * confusing ways. Rather than let that happen silently, we scan the source
 * up-front and surface a clear, honest message.
 *
 * This is deliberately a light lexical scan (comment lines stripped, word
 * boundaries) — cheap and good enough. A rare false positive is acceptable; a
 * silent hang is not.
 */

export interface SupportIssue {
  /** `block` = we refuse to run (it would hang); `warn` = runs, but may misbehave. */
  severity: "block" | "warn";
  title: string;
  detail: string;
}

interface Rule {
  severity: "block" | "warn";
  test: RegExp;
  title: string;
  detail: string;
}

const RULES: Rule[] = [
  {
    severity: "block",
    test: /\binput\s*\(/,
    title: "Reads input via input()",
    detail:
      "Reading from standard input isn't supported yet — the sandbox has no stdin, so input() would hang forever. For now, hardcode the values directly in your code. (stdin support is planned.)",
  },
  {
    severity: "warn",
    test: /\basync\s+def\b|\bawait\b|\bimport\s+asyncio\b/,
    title: "Uses async / await",
    detail:
      "Asynchronous code isn't traced reliably — the step-by-step view may be incomplete or out of order.",
  },
  {
    severity: "warn",
    test: /\b(import|from)\s+(threading|multiprocessing|concurrent)\b/,
    title: "Uses threads or processes",
    detail:
      "The sandbox is single-threaded — threading / multiprocessing won't run in parallel and may error.",
  },
  {
    severity: "warn",
    test: /\b(import|from)\s+(socket|requests|urllib|http|aiohttp|ssl)\b/,
    title: "Uses networking",
    detail:
      "The browser sandbox has no network access — network imports and calls will fail.",
  },
  {
    severity: "warn",
    test: /\bopen\s*\(/,
    title: "Opens a file",
    detail:
      "Only an in-memory filesystem is available — real files on your machine can't be read or written.",
  },
];

/** Strip full-line comments so a `# input(...)` note doesn't trip a rule. */
function stripComments(code: string): string {
  return code
    .split("\n")
    .map((line) => (line.trim().startsWith("#") ? "" : line))
    .join("\n");
}

export function preflightCheck(code: string): SupportIssue[] {
  const scan = stripComments(code);
  const issues: SupportIssue[] = [];
  for (const rule of RULES) {
    if (rule.test.test(scan)) {
      issues.push({ severity: rule.severity, title: rule.title, detail: rule.detail });
    }
  }
  return issues;
}
