/**
 * Pre-flight support check.
 *
 * RunX executes code in sandboxed Web Workers — Python via Pyodide, JavaScript
 * via a plain worker: no network, no real filesystem, no DOM. Some code
 * therefore hangs or fails in confusing ways. Rather than let that happen
 * silently, we scan the source up-front and surface a clear, honest message.
 * Rules are per-language; the Python set is unchanged from the original
 * Python-only check.
 *
 * This is deliberately a light lexical scan (comment lines stripped, word
 * boundaries) — cheap and good enough. A rare false positive is acceptable; a
 * silent hang is not.
 */

import type { Language } from "@/lib/execution/entry";

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

const PYTHON_RULES: Rule[] = [
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

const JS_RULES: Rule[] = [
  {
    severity: "warn",
    test: /^\s*import\s.+\bfrom\b|\brequire\s*\(/m,
    title: "Uses modules",
    detail:
      "The sandbox runs a single script — import/require of packages isn't available; paste self-contained code.",
  },
  {
    severity: "warn",
    test: /\bdocument\.|\bwindow\.|\balert\s*\(|\blocalStorage\b/,
    title: "Uses browser APIs",
    detail:
      "Code runs in a worker with no page — document/window/alert/localStorage aren't available.",
  },
  {
    severity: "warn",
    test: /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/,
    title: "Uses networking",
    detail:
      "The sandbox has no network access — fetch and other network calls will fail.",
  },
];

const RULES_BY_LANGUAGE: Partial<Record<Language, Rule[]>> = {
  python: PYTHON_RULES,
  javascript: JS_RULES,
};

/** Strip full-line comments so a `# input(...)` note doesn't trip a rule. */
function stripComments(code: string, language: Language): string {
  const marker = language === "python" ? "#" : "//";
  return code
    .split("\n")
    .map((line) => (line.trim().startsWith(marker) ? "" : line))
    .join("\n");
}

export function preflightCheck(code: string, language: Language = "python"): SupportIssue[] {
  const scan = stripComments(code, language);
  const issues: SupportIssue[] = [];
  for (const rule of RULES_BY_LANGUAGE[language] ?? []) {
    if (rule.test.test(scan)) {
      issues.push({ severity: rule.severity, title: rule.title, detail: rule.detail });
    }
  }
  return issues;
}

/** True when the code reads standard input — reveals the stdin panel. */
export function usesStdin(code: string, language: Language = "python"): boolean {
  const scan = stripComments(code, language);
  if (language === "javascript") {
    return /\bprompt\s*\(/.test(scan) || /\breadline\s*\(/.test(scan);
  }
  return /\binput\s*\(/.test(scan) || /\bsys\.stdin\b/.test(scan);
}
