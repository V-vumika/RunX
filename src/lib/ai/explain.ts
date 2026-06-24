/**
 * LLM explanation layer — SCAFFOLD ONLY (no provider wired yet).
 *
 * ⚠️ Server-side only. Never import this from a client component — API keys
 * live in env vars and must never reach the browser (project rule). The only
 * caller today is the Route Handler at src/app/api/explain/route.ts.
 *
 * Design (matches the roadmap's "provider-agnostic LLM interface"): one small
 * function signature, one swappable provider. The rules-based narrator
 * (src/lib/explain/narrate.ts) and classifier (classify.ts) are the live,
 * always-on explanation path; this layer is purely additive prose on top of
 * the structured facts they produce. The complexity *class* is NEVER decided
 * here — it arrives already-decided in the request.
 *
 * To go live later: set EXPLAIN_PROVIDER + the matching API key in env and
 * implement `callProvider` for that provider. Nothing else changes.
 */

export interface ExplainContext {
  /** Title from the rules classifier, e.g. "Bubble Sort". */
  title: string;
  /** Big-O class decided by the rules classifier — passed in, never computed here. */
  complexity: string;
  /** The user's full source. */
  code: string;
  /** Optional: the rules narrator's line for the current step, for "explain deeper". */
  currentStepText?: string;
  /** Optional: the current source line. */
  currentStepLine?: string;
}

export interface ExplainResult {
  /** Prose explanation, or null when no provider is configured. */
  text: string | null;
  /** True when an LLM actually produced the text. */
  configured: boolean;
}

/** Which provider, if any, is configured via env. */
function configuredProvider(): string | null {
  const p = process.env.EXPLAIN_PROVIDER?.trim().toLowerCase();
  if (!p) return null;
  return p;
}

/**
 * Produce a plain-English explanation for the given context.
 *
 * Returns `{ text: null, configured: false }` until a provider is wired — the
 * UI is expected to fall back to the rules-based explanation in that case, so
 * the feature degrades gracefully with zero configuration.
 */
export async function explainWithLLM(context: ExplainContext): Promise<ExplainResult> {
  const provider = configuredProvider();
  if (!provider) {
    return { text: null, configured: false };
  }

  // Provider implementations land here (Phase 8/10). Kept as an explicit
  // unconfigured stub so the contract + route exist now and the rules narrator
  // remains the live path.
  void context;
  return { text: null, configured: false };
}
