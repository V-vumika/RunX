/**
 * POST /api/explain — server-side entry for the optional LLM explanation layer.
 *
 * Keeps any future API key on the server (project rule: keys never reach the
 * client). Returns `{ text: null, configured: false }` until a provider is
 * wired in src/lib/ai/explain.ts, so the client falls back to the always-on
 * rules-based explanation.
 */

import { explainWithLLM, type ExplainContext } from "@/lib/ai/explain";

export async function POST(request: Request) {
  let body: Partial<ExplainContext>;
  try {
    body = (await request.json()) as Partial<ExplainContext>;
  } catch {
    return Response.json({ text: null, configured: false, error: "invalid JSON" }, { status: 400 });
  }

  const result = await explainWithLLM({
    title: body.title ?? "",
    complexity: body.complexity ?? "—",
    code: body.code ?? "",
    currentStepText: body.currentStepText,
    currentStepLine: body.currentStepLine,
  });

  return Response.json(result);
}
