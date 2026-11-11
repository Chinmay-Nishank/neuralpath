'use client';

export interface PyodideStatus {
  phase: 'idle' | 'downloading' | 'initializing' | 'loading-packages' | 'ready' | 'running' | 'error';
  progress: number;
  message: string;
}

export interface PyodideRunResult {
  stdout: string;
  stderr: string;
  plots: string[];
  elapsedMs: number;
}

type StatusListener = (status: PyodideStatus) => void;

class PyodideManager {
  private worker: Worker | null = null;
  private status: PyodideStatus = { phase: 'idle', progress: 0, message: '' };
  private statusListeners = new Set<StatusListener>();
  private pending = new Map<
    string,
    { resolve: (res: PyodideRunResult) => void; reject: (err: Error) => void }
  >();
  private cachedDatasets: Record<string, string> | null = null;

  subscribe(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private emitStatus(status: PyodideStatus) {
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private async loadBundledDatasets(): Promise<Record<string, string>> {
    if (this.cachedDatasets) return this.cachedDatasets;
    const files = ['housing_mini.csv', 'iris_mini.csv', 'spam_mini.csv'];
    const entries: Record<string, string> = {};
    await Promise.all(
      files.map(async (name) => {
        try {
          const res = await fetch(`/datasets/${name}`);
          if (res.ok) {
            entries[name] = await res.text();
          }
        } catch {
          // Offline fallback handled gracefully
        }
      })
    );
    this.cachedDatasets = entries;
    return entries;
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker('/workers/pyodide.worker.js');
    worker.onmessage = (event) => {
      const data = event.data as {
        id?: string;
        type: string;
        phase?: PyodideStatus['phase'];
        progress?: number;
        message?: string;
        stdout?: string;
        stderr?: string;
        plots?: string[];
        elapsedMs?: number;
        error?: string;
      };

      if (data.type === 'status' && data.phase) {
        this.emitStatus({
          phase: data.phase,
          progress: data.progress ?? 0,
          message: data.message ?? '',
        });
        return;
      }

      if (!data.id) return;
      const req = this.pending.get(data.id);
      if (!req) return;
      this.pending.delete(data.id);

      if (data.type === 'result') {
        this.emitStatus({ phase: 'ready', progress: 100, message: 'Python runtime ready' });
        req.resolve({
          stdout: data.stdout ?? '',
          stderr: data.stderr ?? '',
          plots: data.plots ?? [],
          elapsedMs: data.elapsedMs ?? 0,
        });
      } else if (data.type === 'error') {
        this.emitStatus({ phase: 'error', progress: 100, message: data.error ?? 'Execution failed' });
        req.reject(new Error(data.error ?? 'Python execution failed'));
      }
    };

    worker.onerror = (err) => {
      this.emitStatus({ phase: 'error', progress: 0, message: err.message });
    };

    this.worker = worker;
    return worker;
  }

  async run(code: string): Promise<PyodideRunResult> {
    const datasets = await this.loadBundledDatasets();
    const worker = this.ensureWorker();
    if (this.status.phase === 'ready') {
      this.emitStatus({ phase: 'running', progress: 100, message: 'Running Python...' });
    }
    const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return new Promise<PyodideRunResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, type: 'run', code, datasets });
    });
  }
}

export const pyodideManager = new PyodideManager();

