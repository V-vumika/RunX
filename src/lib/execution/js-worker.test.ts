import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RunResult } from "@/types/snapshot";

/**
 * Executes the REAL JavaScript worker (public/workers/js.worker.js) under Node
 * with a shimmed `self`, driving it through its message protocol. The worker is
 * deliberately dependency-free (no importScripts), so this exercises the exact
 * code the browser runs: console capture, stdin via prompt/readline, error
 * line mapping, async support, and the RunResult contract shape.
 */

const src = readFileSync(
  resolve(__dirname, "../../../public/workers/js.worker.js"),
  "utf-8"
);

interface WorkerMessage {
  type: string;
  id?: number;
  result?: RunResult;
  error?: string;
}

function bootWorker() {
  const messages: WorkerMessage[] = [];
  const self = {
    postMessage: (m: WorkerMessage) => messages.push(m),
    onmessage: null as unknown as (e: { data: unknown }) => Promise<void>,
  };
  // Evaluate the worker script with `self` bound to our shim (classic-worker style).
  new Function("self", src)(self);
  return { messages, self };
}

async function run(code: string, options?: { stdin?: string }): Promise<RunResult> {
  const { messages, self } = bootWorker();
  await self.onmessage({ data: { type: "run", id: 1, code, options } });
  const result = messages.find((m) => m.type === "result");
  expect(result, `no result message; got: ${JSON.stringify(messages)}`).toBeDefined();
  return result!.result!;
}

describe("js worker", () => {
  it("posts ready on boot", () => {
    const { messages } = bootWorker();
    expect(messages[0]).toEqual({ type: "ready" });
  });

  it("captures console output and formats values", async () => {
    const r = await run(
      "console.log('sum:', 1 + 2);\nconsole.log([1, 2], { a: 1 });"
    );
    expect(r.error).toBeNull();
    expect(r.stdout).toBe("sum: 3\n[ 1, 2 ] { a: 1 }\n");
  });

  it("returns one final snapshot carrying the stdout (contract shape)", async () => {
    const r = await run("console.log('hi')");
    expect(r.snapshots).toHaveLength(1);
    const snap = r.snapshots[0];
    expect(snap.final).toBe(true);
    expect(snap.stdout).toBe("hi\n");
    expect(snap.stack[0].functionName).toBe("<module>");
    expect(r.truncated).toBe(false);
    expect(typeof r.durationMs).toBe("number");
  });

  it("scopes runs: declarations don't leak into the worker global", async () => {
    await run("var leaked = 42; function f() {}");
    const r = await run("console.log(typeof leaked, typeof f);");
    expect(r.stdout).toBe("undefined undefined\n");
  });

  it("reports runtime errors with type, message, and mapped line", async () => {
    const r = await run("const a = 1;\nconst b = 2;\nnull.x = 3;");
    expect(r.error).not.toBeNull();
    expect(r.error!.type).toBe("TypeError");
    expect(r.error!.message.length).toBeGreaterThan(0);
    expect(r.error!.line).toBe(3);
  });

  it("keeps output printed before the error", async () => {
    const r = await run("console.log('before');\nthrow new Error('boom');");
    expect(r.stdout).toBe("before\n");
    expect(r.error!.message).toBe("boom");
  });

  it("feeds stdin to prompt()/readline(), null at EOF", async () => {
    const r = await run(
      "const a = prompt('a?');\nconst b = readline();\nconsole.log(a, b, readline());",
      { stdin: "7\n8" }
    );
    expect(r.error).toBeNull();
    expect(r.stdout).toBe("7 8 null\n");
  });

  it("supports async/await at the top level", async () => {
    const r = await run(
      "const v = await Promise.resolve(5);\nconsole.log('got', v);"
    );
    expect(r.error).toBeNull();
    expect(r.stdout).toBe("got 5\n");
  });

  it("handles circular structures without crashing", async () => {
    const r = await run("const o = { n: 1 };\no.self = o;\nconsole.log(o);");
    expect(r.error).toBeNull();
    expect(r.stdout).toContain("[Circular]");
  });
});
