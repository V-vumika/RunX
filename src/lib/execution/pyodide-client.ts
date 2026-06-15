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
}

type StatusListener = (status: EngineStatus, error?: string) => void;

const WORKER_URL = "/workers/pyodide.worker.js";

interface PendingRun {
  resolve: (result: RunResult) => void;
  reject: (error: Error) => void;
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
      case "init-error":
        this.setStatus("error", data.error);
        this.failAllPending(data.error);
        break;
      case "result": {
        const pending = this.pending.get(data.id);
        if (pending) {
          this.pending.delete(data.id);
          pending.resolve(data.result);
        }
        break;
      }
      case "run-error": {
        const pending = this.pending.get(data.id);
        if (pending) {
          this.pending.delete(data.id);
          pending.reject(new Error(data.error));
        }
        break;
      }
    }
  }

  private failAllPending(message: string) {
    for (const pending of this.pending.values()) {
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
      this.pending.set(id, { resolve, reject });
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
