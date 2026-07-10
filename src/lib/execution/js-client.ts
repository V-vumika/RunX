import type { RunResult } from "@/types/snapshot";
import type { EngineStatus, RunOptions } from "@/lib/execution/pyodide-client";

/**
 * Browser-side client for the JavaScript execution worker.
 *
 * Owns a single classic Web Worker (public/workers/js.worker.js) and exposes
 * the same typed surface as the Pyodide client — status subscription, a
 * watchdog-guarded {@link JsClient.run}, and hard worker termination on hang —
 * so the store can treat every language's engine identically (see
 * providers.ts). Kept as a sibling of pyodide-client.ts rather than a shared
 * base class on purpose: the Python client is frozen ("Python must remain
 * unchanged"), and the future Java/C++ providers are HTTP-shaped (Judge0), so
 * the worker-client pattern won't generalize past these two anyway.
 *
 * Unlike Pyodide there is no multi-MB runtime to download — the worker is
 * ready almost immediately — so the load budget is short.
 */

type StatusListener = (status: EngineStatus, error?: string) => void;

// The `?v=` tag busts the browser's aggressive Web Worker cache — bump it when
// the worker changes so the new version is fetched instead of a stale one.
const WORKER_URL = "/workers/js.worker.js?v=20260710-initial";

/** Budget for the first run (just fetching + parsing the tiny worker script). */
const LOAD_TIMEOUT_MS = 10_000;
/** Budget for executing user code — kills infinite loops (sync JS can't be interrupted). */
const EXEC_TIMEOUT_MS = 12_000;

interface PendingRun {
  resolve: (result: RunResult) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
}

class JsClient {
  private worker: Worker | null = null;
  private status: EngineStatus = "uninitialized";
  private initError?: string;
  private nextId = 1;
  private pending = new Map<number, PendingRun>();
  private listeners = new Set<StatusListener>();

  getStatus(): EngineStatus {
    return this.status;
  }

  /** Subscribe to engine status changes. Fires immediately with current status. */
  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.initError);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(status: EngineStatus, error?: string) {
    this.status = status;
    this.initError = error;
    for (const listener of this.listeners) listener(status, error);
  }

  /** Create the worker. Safe to call repeatedly. */
  init(): void {
    if (this.worker || typeof window === "undefined") return;
    this.setStatus("loading");
    const worker = new Worker(WORKER_URL);
    worker.onmessage = (event) => this.handleMessage(event);
    worker.onerror = (event) => {
      this.failAllPending(event.message || "JavaScript worker crashed.");
      this.setStatus("error", event.message || "JavaScript worker crashed.");
    };
    this.worker = worker;
  }

  private handleMessage(event: MessageEvent) {
    const data = event.data as
      | { type: "ready" }
      | { type: "running"; id: number }
      | { type: "result"; id: number; result: RunResult }
      | { type: "run-error"; id: number; error: string };

    switch (data.type) {
      case "ready":
        this.setStatus("ready");
        break;
      case "running": {
        // Loading is done; re-arm the watchdog with the exec budget.
        const pending = this.pending.get(data.id);
        if (pending) this.armTimer(data.id, EXEC_TIMEOUT_MS);
        break;
      }
      case "result": {
        const pending = this.pending.get(data.id);
        if (pending) {
          if (pending.timer) clearTimeout(pending.timer);
          this.pending.delete(data.id);
          pending.resolve(data.result);
        }
        break;
      }
      case "run-error": {
        const pending = this.pending.get(data.id);
        if (pending) {
          if (pending.timer) clearTimeout(pending.timer);
          this.pending.delete(data.id);
          pending.reject(new Error(data.error));
        }
        break;
      }
    }
  }

  /** (Re)start the watchdog for a run; on fire, the hung worker is killed. */
  private armTimer(id: number, ms: number) {
    const pending = this.pending.get(id);
    if (!pending) return;
    if (pending.timer) clearTimeout(pending.timer);
    pending.timer = setTimeout(() => this.onTimeout(id), ms);
  }

  /** A run overran its budget — reject it and hard-reset the worker to recover. */
  private onTimeout(id: number) {
    const pending = this.pending.get(id);
    const message =
      "Execution timed out — the program may have an infinite loop. The engine was reset; try again.";
    if (pending) {
      if (pending.timer) clearTimeout(pending.timer);
      this.pending.delete(id);
      pending.reject(new Error(message));
    }
    // Terminate the hung worker (there's no other way to stop it) and drop it;
    // the next run() lazily spins up a fresh one.
    this.failAllPending(message);
    this.worker?.terminate();
    this.worker = null;
    this.setStatus("uninitialized");
  }

  private failAllPending(message: string) {
    for (const pending of this.pending.values()) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.reject(new Error(message));
    }
    this.pending.clear();
  }

  /** Run JavaScript source and resolve with the captured result. */
  run(code: string, options?: RunOptions): Promise<RunResult> {
    this.init();
    if (!this.worker) {
      return Promise.reject(
        new Error("Execution engine is only available in the browser.")
      );
    }
    if (this.status === "error") {
      return Promise.reject(
        new Error(this.initError || "Execution engine failed to initialize.")
      );
    }
    const id = this.nextId++;
    return new Promise<RunResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, timer: null });
      // Start with the load budget; the worker's "running" message swaps it for
      // the exec budget once user code is about to execute.
      this.armTimer(id, LOAD_TIMEOUT_MS);
      this.worker!.postMessage({ type: "run", id, code, options });
    });
  }

  /** Tear down the worker (e.g. on hot reload). */
  terminate(): void {
    this.failAllPending("Execution engine was terminated.");
    this.worker?.terminate();
    this.worker = null;
    this.setStatus("uninitialized");
  }
}

let singleton: JsClient | null = null;

/** Get the shared JavaScript execution client (created lazily, browser-only). */
export function getJsClient(): JsClient {
  if (!singleton) singleton = new JsClient();
  return singleton;
}
