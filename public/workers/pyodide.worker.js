// Sandboxed Pyodide Web Worker for NeuralPath.
// Executes learner Python code off the main UI thread with network APIs locked down
// prior to evaluating user code.

const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/';
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;

let pyodide = null;
let initPromise = null;
let networkLocked = false;

function lockWorkerNetwork() {
  if (networkLocked) return;
  networkLocked = true;

  const blockedError = () => {
    throw new Error('Network access is disabled inside the NeuralPath Python sandbox.');
  };

  try {
    Object.defineProperty(self, 'fetch', {
      value: () => Promise.reject(new Error('Network access is disabled in sandbox.')),
      writable: false,
      configurable: false,
    });
  } catch {
    self.fetch = () => Promise.reject(new Error('Network access is disabled in sandbox.'));
  }

  try {
    self.XMLHttpRequest = function () {
      blockedError();
    };
  } catch {}

  try {
    self.WebSocket = function () {
      blockedError();
    };
  } catch {}

  try {
    self.EventSource = function () {
      blockedError();
    };
  } catch {}
}

async function ensurePyodide(datasets) {
  if (pyodide) return pyodide;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    postMessage({ type: 'status', phase: 'downloading', progress: 15, message: 'Downloading WebAssembly Python runtime...' });
    importScripts(PYODIDE_SCRIPT_URL);

    postMessage({ type: 'status', phase: 'initializing', progress: 45, message: 'Initializing Python interpreter...' });
    pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });

    postMessage({ type: 'status', phase: 'loading-packages', progress: 70, message: 'Loading NumPy, pandas, and scikit-learn...' });
    await pyodide.loadPackage(['numpy', 'pandas', 'scikit-learn', 'matplotlib']);

    // Mount bundled datasets into /datasets inside Pyodide virtual FS
    try {
      pyodide.FS.mkdir('/datasets');
    } catch {}
    if (datasets && typeof datasets === 'object') {
      for (const [filename, content] of Object.entries(datasets)) {
        if (typeof content === 'string') {
          pyodide.FS.writeFile(`/datasets/${filename}`, content);
        }
      }
    }

    // Configure non-interactive Matplotlib backend + plot helper
    await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import io, base64

_np_captured_plots = []

def _np_capture_show(*args, **kwargs):
    for fig_num in plt.get_fignums():
        fig = plt.figure(fig_num)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=130, bbox_inches="tight")
        buf.seek(0)
        _np_captured_plots.append(base64.b64encode(buf.read()).decode("ascii"))
    plt.close("all")

plt.show = _np_capture_show
`);

    // Lock down browser network APIs before running any user-supplied Python
    lockWorkerNetwork();
    postMessage({ type: 'status', phase: 'ready', progress: 100, message: 'Python runtime ready' });
    return pyodide;
  })();

  return initPromise;
}

self.onmessage = async (event) => {
  const { id, type, code, datasets } = event.data || {};

  if (type === 'warmup') {
    try {
      await ensurePyodide(datasets);
      postMessage({ id, type: 'warmed' });
    } catch (err) {
      postMessage({ id, type: 'error', error: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  if (type === 'run') {
    try {
      const py = await ensurePyodide(datasets);
      const stdoutLines = [];
      const stderrLines = [];

      py.setStdout({
        batched: (text) => {
          stdoutLines.push(text);
        },
      });
      py.setStderr({
        batched: (text) => {
          stderrLines.push(text);
        },
      });

      await py.runPythonAsync(`
_np_captured_plots.clear()
import matplotlib.pyplot as plt
plt.close("all")
`);

      const started = performance.now();
      await py.runPythonAsync(code);

      // Capture any open figure even if user omitted plt.show()
      const plotsProxy = await py.runPythonAsync(`
if plt.get_fignums():
    _np_capture_show()
list(_np_captured_plots)
`);
      const plots = plotsProxy && typeof plotsProxy.toJs === 'function' ? plotsProxy.toJs() : [];
      if (plotsProxy && typeof plotsProxy.destroy === 'function') {
        plotsProxy.destroy();
      }

      const elapsedMs = Math.round(performance.now() - started);
      postMessage({
        id,
        type: 'result',
        stdout: stdoutLines.join('\n'),
        stderr: stderrLines.join('\n'),
        plots: Array.from(plots),
        elapsedMs,
      });
    } catch (err) {
      postMessage({
        id,
        type: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
};
