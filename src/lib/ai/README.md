# AI layer

Provider-agnostic interface for the complexity analyzer and AI teacher
(Phases 7–8). Keep a single `AIProvider` interface so OpenAI / Gemini can be
swapped without touching call sites.

```ts
export interface AIProvider {
  explainStep(snapshot: Snapshot, code: string): Promise<string>;
  explainComplexity(code: string, analysis: ComplexityAnalysis): Promise<string>;
}
```

Important: the **complexity class** itself is determined by a rules-based
structural analyzer (loop nesting + recursion detection), *not* by the LLM. The
LLM only generates the natural-language explanation on top of that result.

All provider calls must run server-side (Route Handlers / Server Actions) so API
keys never reach the client.
