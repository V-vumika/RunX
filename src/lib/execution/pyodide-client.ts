import type { RunResult } from "@/types/snapshot";

/**
 * Browser-side client for the Pyodide execution worker.
 *
 * Owns a single classic Web Worker (public/workers/pyodide.worker.js), tracks
 * the runtime's load status, and exposes a typed {@link PyodideClient.run}
 * that resolves with a {@link RunResult}. A module-level singleton is shared
 * across the app via {@link getPyodideClient}.
 */

export type EngineStatus = "uninitialized" | "loading" | "ready" | "error";

export interface RunOptions {
  /** Maximum number of snapshots before tracing stops (guards infinite loops). */
  maxSteps?: number;
  /** Maximum collection items serialized per value. */
  maxItems?: number;
  /** Maximum recursion depth when serializing nested values. */
  maxDepth?: number;
  /** Maximum string/repr length before truncation. */
  maxString?: number;
  /** Text fed to input() / sys.stdin for programs that read standard input. */
  stdin?: string;
}

type StatusListener = (status: EngineStatus, error?: string) => void;

// The `?v=` tag busts the browser's aggressive Web Worker cache — bump it when
// the worker changes so the new version is fetched instead of a stale one.
const WORKER_URL = "/workers/pyodide.worker.js?v=20260708-runcomplete2";

/** Budget for the first run (includes downloading + initializing Pyodide). */
const LOAD_TIMEOUT_MS = 60_000;
/** Budget for executing user code once the runtime is ready. */
const EXEC_TIMEOUT_MS = 12_000;

interface PendingRun {
  resolve: (result: RunResult) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
}

class PyodideClient {
  private worker: Worker | null = null;
  private status: EngineStatus = "uninitialized";
  private initError?: string;
  private nextId = 1;
  private pending = new Map<number, PendingRun>();
  private listeners = new Set<StatusListener>();

  getStatus(): EngineStatus {
    return this.status;
  }

  getInitError(): string | undefined {
    return this.initError;
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

  /** Create the worker and begin loading Pyodide. Safe to call repeatedly. */
  init(): void {
    if (this.worker || typeof window === "undefined") return;
    this.setStatus("loading");
    const worker = new Worker(WORKER_URL);
    worker.onmessage = (event) => this.handleMessage(event);
    worker.onerror = (event) => {
      this.failAllPending(event.message || "Execution worker crashed.");
      this.setStatus("error", event.message || "Execution worker crashed.");
    };
    this.worker = worker;
  }

  private handleMessage(event: MessageEvent) {
    const data = event.data as
      | { type: "status"; status: string }
      | { type: "ready" }
      | { type: "running"; id: number }
      | { type: "init-error"; error: string }
      | { type: "result"; id: number; result: RunResult }
      | { type: "run-error"; id: number; error: string };

    switch (data.type) {
      case "status":
        // Runtime is downloading/initializing; status stays "loading".
        break;
      case "ready":
        this.setStatus("ready");
        break;
      case "running": {
        // Loading is done; re-arm the watchdog with the (shorter) exec budget.
        const pending = this.pending.get(data.id);
        if (pending) this.armTimer(data.id, EXEC_TIMEOUT_MS);
        break;
      }
      case "init-error":
        this.setStatus("error", data.error);
        this.failAllPending(data.error);
        break;
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
      "Execution timed out — the program may have an infinite loop or a very large input. The engine was reset; try a smaller input.";
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

  /** Run Python source and resolve with the captured execution trace. */
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
      // the shorter exec budget once the runtime is ready.
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

let singleton: PyodideClient | null = null;

/** Get the shared execution-engine client (created lazily, browser-only). */
export function getPyodideClient(): PyodideClient {
  if (!singleton) singleton = new PyodideClient();
  return singleton;
}
