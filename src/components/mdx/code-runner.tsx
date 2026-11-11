'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Image as ImageIcon,
  Code2,
  ExternalLink,
  Download,
  Lightbulb,
  Eye,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProgressBar } from '@/components/ui/progress';
import { pyodideManager, type PyodideRunResult, type PyodideStatus } from './pyodide-client';
import { buildIpynbPayload, getColabUrl } from '@/lib/colab';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center bg-subtle/60 font-mono text-xs text-primary-secondary">
      Loading interactive editor...
    </div>
  ),
});

export interface CodeRunnerProps {
  title?: string;
  code: string;
  libraryCode?: string;
  colabCode?: string;
  colabNotebook?: string;
  exerciseStarter?: string;
  exerciseTests?: string;
  exerciseSolution?: string;
  hint1?: string;
  hint2?: string;
  highlightLines?: number[];
  runnable?: boolean;
  defaultTab?: 'scratch' | 'library' | 'exercise';
  language?: 'python' | 'bash' | 'json' | 'typescript';
}

type LevelTab = 'scratch' | 'library' | 'exercise';
type OutputTab = 'code' | 'output' | 'plots';

function parseErrorLine(errorMsg: string): number | null {
  const match = errorMsg.match(/File "<exec>", line (\d+)/);
  if (match && match[1]) {
    const num = Number(match[1]);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

export function CodeRunner({
  title = 'Interactive Python Lab',
  code,
  libraryCode,
  colabCode,
  colabNotebook,
  exerciseStarter,
  exerciseTests,
  exerciseSolution,
  hint1,
  hint2,
  highlightLines = [],
  runnable = true,
  defaultTab = 'scratch',
  language = 'python',
}: CodeRunnerProps) {
  const hasLevels = Boolean(libraryCode || exerciseStarter);
  const [levelTab, setLevelTab] = React.useState<LevelTab>(defaultTab);
  const [viewTab, setViewTab] = React.useState<OutputTab>('code');
  const [editorActive, setEditorActive] = React.useState(false);

  const initialCodeForTab = React.useCallback(
    (tab: LevelTab): string => {
      if (tab === 'library' && libraryCode) return libraryCode.trim();
      if (tab === 'exercise' && exerciseStarter) return exerciseStarter.trim();
      return code.trim();
    },
    [code, libraryCode, exerciseStarter]
  );

  const [buffers, setBuffers] = React.useState<Record<LevelTab, string>>({
    scratch: code.trim(),
    library: (libraryCode ?? '').trim(),
    exercise: (exerciseStarter ?? '').trim(),
  });

  const currentCode = buffers[levelTab];

  const [copied, setCopied] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [pyStatus, setPyStatus] = React.useState<PyodideStatus>({
    phase: 'idle',
    progress: 0,
    message: '',
  });
  const [result, setResult] = React.useState<PyodideRunResult | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [testsPassed, setTestsPassed] = React.useState<boolean | null>(null);

  // Exercise progressive hints
  const [hintStep, setHintStep] = React.useState<0 | 1 | 2>(0);
  const [solutionRevealed, setSolutionRevealed] = React.useState(false);

  // Optional Shiki client highlighting for static view
  const [highlightedLinesHtml, setHighlightedLinesHtml] = React.useState<string[] | null>(null);

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [nearViewport, setNearViewport] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || nearViewport) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nearViewport]);

  React.useEffect(() => {
    const unsub = pyodideManager.subscribe(setPyStatus);
    return unsub;
  }, []);

  React.useEffect(() => {
    if (editorActive || !nearViewport) return;
    let cancelled = false;
    async function highlight() {
      try {
        const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, theme] =
          await Promise.all([
            import('shiki/core'),
            import('shiki/engine/javascript'),
            import('shiki/themes/github-dark-default.mjs'),
          ]);
        const win = window as Window & {
          __neuralpathHighlighter?: Promise<Awaited<ReturnType<typeof createHighlighterCore>>>;
        };
        if (!win.__neuralpathHighlighter) {
          win.__neuralpathHighlighter = createHighlighterCore({
            themes: [theme.default],
            langs: [],
            engine: createJavaScriptRegexEngine(),
          });
        }
        const highlighter = await win.__neuralpathHighlighter;
        if (!highlighter.getLoadedLanguages().includes(language)) {
          const langMod =
            language === 'python'
              ? await import('shiki/langs/python.mjs')
              : language === 'bash'
              ? await import('shiki/langs/bash.mjs')
              : language === 'json'
              ? await import('shiki/langs/json.mjs')
              : await import('shiki/langs/typescript.mjs');
          await highlighter.loadLanguage(langMod.default);
        }
        const { tokens } = highlighter.codeToTokens(currentCode, {
          lang: language,
          theme: 'github-dark-default',
        });
        if (cancelled) return;
        const lines = tokens.map((line) =>
          line
            .map((tok) => {
              const escaped = tok.content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
              return tok.color
                ? `<span style="color:${tok.color}">${escaped}</span>`
                : escaped;
            })
            .join('')
        );
        setHighlightedLinesHtml(lines);
      } catch {
        setHighlightedLinesHtml(null);
      }
    }

    const timeoutId = globalThis.setTimeout(() => {
      void highlight();
    }, 60);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, [currentCode, language, editorActive, nearViewport]);

  const handleRun = React.useCallback(async () => {
    if (!runnable || language !== 'python') return;
    setRunning(true);
    setErrorMsg(null);
    setTestsPassed(null);
    setViewTab('output');

    const codeToExecute =
      levelTab === 'exercise' && exerciseTests
        ? `${currentCode}\n\n# --- Auto-checker tests ---\n${exerciseTests.trim()}\nprint("\\n[PASS] All exercise checks passed.")`
        : currentCode;

    try {
      const res = await pyodideManager.run(codeToExecute);
      setResult(res);
      if (levelTab === 'exercise' && exerciseTests) {
        setTestsPassed(true);
      }
      if (res.plots.length > 0 && !res.stdout.trim()) {
        setViewTab('plots');
      }
      trackEvent('code_run', { title, tab: levelTab, success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      if (levelTab === 'exercise' && exerciseTests) {
        setTestsPassed(false);
      }
      trackEvent('code_run', { title, tab: levelTab, success: false });
    } finally {
      setRunning(false);
    }
  }, [runnable, language, levelTab, exerciseTests, currentCode, title]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const handleReset = () => {
    setBuffers((prev) => ({
      ...prev,
      [levelTab]: initialCodeForTab(levelTab),
    }));
    setErrorMsg(null);
    setTestsPassed(null);
  };

  const handleDownloadNotebook = () => {
    const notebookContent = buildIpynbPayload(
      title,
      colabCode ?? currentCode,
      typeof window !== 'undefined' ? window.location.href : undefined
    );
    const blob = new Blob([notebookContent], { type: 'application/x-ipynb+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ipynb`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const errorLine = errorMsg ? parseErrorLine(errorMsg) : null;
  const rawLines = currentCode.split('\n');
  const colabHref = colabCode || colabNotebook ? getColabUrl(colabNotebook) : null;

  return (
    <section
      ref={containerRef}
      aria-label={title}
      onFocus={() => setNearViewport(true)}
      onPointerEnter={() => setNearViewport(true)}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && runnable) {
          e.preventDefault();
          void handleRun();
        }
      }}
      className="cv-auto my-6 overflow-hidden rounded-md border border-hairline bg-surface shadow-sm"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-subtle px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Code2 className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="text-xs font-semibold text-primary">{title}</span>
          {language === 'python' && runnable && (
            <Badge variant={running ? 'warning' : errorMsg ? 'danger' : result ? 'success' : 'neutral'}>
              {running
                ? 'Running'
                : errorMsg
                ? 'Error'
                : result
                ? `Done (${result.elapsedMs}ms)`
                : 'Ready'}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {language === 'python' && runnable && !editorActive && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditorActive(true)}
            >
              Edit Code
            </Button>
          )}

          <Button size="sm" variant="ghost" onClick={handleCopy} aria-label="Copy code">
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </Button>

          <Button size="sm" variant="ghost" onClick={handleReset} aria-label="Reset code">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          {colabHref && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadNotebook}
                aria-label="Download Jupyter notebook"
                title="Download .ipynb"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden md:inline">.ipynb</span>
              </Button>
              <a
                href={colabHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-strong bg-surface px-3 text-xs font-medium text-primary transition-colors hover:bg-subtle"
              >
                <span>Open in Colab</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </>
          )}

          {language === 'python' && runnable && (
            <Button size="sm" onClick={() => void handleRun()} loading={running}>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Run</span>
              <span className="hidden text-[10px] opacity-80 lg:inline">(Ctrl+Enter)</span>
            </Button>
          )}
        </div>
      </div>

      {/* Curriculum levels (Scratch / Library / Exercise) */}
      {hasLevels && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-canvas/50 px-4 py-2">
          <div role="group" aria-label="Code implementation level" className="inline-flex flex-wrap items-center gap-1 rounded-sm border border-hairline bg-subtle p-1">
            <Button
              size="sm"
              variant={levelTab === 'scratch' ? 'outline' : 'ghost'}
              aria-pressed={levelTab === 'scratch'}
              onClick={() => {
                setLevelTab('scratch');
                setViewTab('code');
                setErrorMsg(null);
              }}
            >
              From Scratch (NumPy)
            </Button>
            {libraryCode && (
              <Button
                size="sm"
                variant={levelTab === 'library' ? 'outline' : 'ghost'}
                aria-pressed={levelTab === 'library'}
                onClick={() => {
                  setLevelTab('library');
                  setViewTab('code');
                  setErrorMsg(null);
                }}
              >
                Library (sklearn / PyTorch)
              </Button>
            )}
            {exerciseStarter && (
              <Button
                size="sm"
                variant={levelTab === 'exercise' ? 'outline' : 'ghost'}
                aria-pressed={levelTab === 'exercise'}
                onClick={() => {
                  setLevelTab('exercise');
                  setViewTab('code');
                  setErrorMsg(null);
                }}
              >
                Exercise
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={viewTab === 'code' ? 'secondary' : 'ghost'}
              onClick={() => setViewTab('code')}
            >
              Code
            </Button>
            <Button
              size="sm"
              variant={viewTab === 'output' ? 'secondary' : 'ghost'}
              onClick={() => setViewTab('output')}
            >
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              Output
            </Button>
            <Button
              size="sm"
              variant={viewTab === 'plots' ? 'secondary' : 'ghost'}
              onClick={() => setViewTab('plots')}
            >
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Plots {result?.plots.length ? `(${result.plots.length})` : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Output / Plots selector when single code block */}
      {!hasLevels && runnable && language === 'python' && (
        <div className="flex items-center justify-between border-b border-hairline bg-canvas/50 px-4 py-1.5">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={viewTab === 'code' ? 'secondary' : 'ghost'}
              onClick={() => setViewTab('code')}
            >
              Code
            </Button>
            <Button
              size="sm"
              variant={viewTab === 'output' ? 'secondary' : 'ghost'}
              onClick={() => setViewTab('output')}
            >
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              Output
            </Button>
            {result && result.plots.length > 0 && (
              <Button
                size="sm"
                variant={viewTab === 'plots' ? 'secondary' : 'ghost'}
                onClick={() => setViewTab('plots')}
              >
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Plots ({result.plots.length})
              </Button>
            )}
          </div>
          <span className="text-[11px] text-primary-muted">
            Sandboxed WebAssembly Python (no network access)
          </span>
        </div>
      )}

      {/* First Pyodide download/init indicator */}
      {running && pyStatus.phase !== 'ready' && pyStatus.phase !== 'running' && (
        <div className="border-b border-hairline bg-accent-soft/30 px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-medium text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" aria-hidden="true" />
              {pyStatus.message || 'Booting Pyodide WebAssembly runtime (~12 MB first load)...'}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Why is this loading?
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Python, NumPy, pandas, and scikit-learn run completely inside your browser using
                  WebAssembly. The first load downloads ~12 MB once and caches locally for instant
                  future runs.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <ProgressBar value={pyStatus.progress} />
        </div>
      )}

      {/* Main Code / Output / Plots panel */}
      {viewTab === 'code' && (
        <div className="bg-[#0d1117] text-[#e6edf3]">
          {editorActive ? (
            <div className="h-[320px] w-full">
              <MonacoEditor
                height="320px"
                language={language}
                theme="vs-dark"
                value={currentCode}
                onChange={(val) => {
                  setBuffers((prev) => ({ ...prev, [levelTab]: val ?? '' }));
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineHeight: 21,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          ) : (
            <div
              tabIndex={0}
              role="region"
              aria-label={`Source code for ${title}`}
              className="max-h-[420px] overflow-x-auto overflow-y-auto py-3 font-mono text-[13px] leading-[1.6]"
            >
              <div className="min-w-max">
                {rawLines.map((lineText, idx) => {
                  const lineNumber = idx + 1;
                  const isHighlighted =
                    highlightLines.includes(lineNumber) || errorLine === lineNumber;
                  const htmlLine = highlightedLinesHtml?.[idx];
                  return (
                    <div
                      key={lineNumber}
                      className={cn(
                        'flex items-baseline',
                        errorLine === lineNumber
                          ? 'bg-red-500/20'
                          : isHighlighted
                          ? 'bg-blue-500/15'
                          : undefined
                      )}
                    >
                      <span className="w-10 shrink-0 select-none pr-3 text-right text-[11px] text-slate-400">
                        {lineNumber}
                      </span>
                      <span className="whitespace-pre pr-4">
                        {htmlLine ? (
                          <span dangerouslySetInnerHTML={{ __html: htmlLine || ' ' }} />
                        ) : (
                          <span>{lineText || ' '}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {viewTab === 'output' && (
        <div className="min-h-[160px] bg-canvas p-4 font-mono text-xs leading-relaxed">
          {running && !result && !errorMsg && (
            <p className="text-primary-secondary">Executing Python in sandboxed Web Worker...</p>
          )}
          {!running && !result && !errorMsg && (
            <p className="text-primary-muted">
              Click <strong>Run</strong> (or press Ctrl/Cmd+Enter) to execute this code in your
              browser.
            </p>
          )}
          {testsPassed !== null && (
            <div
              className={cn(
                'mb-3 flex items-center gap-2 rounded-sm border px-3 py-2 font-sans text-xs font-medium',
                testsPassed
                  ? 'border-success/40 bg-success-soft/50 text-success'
                  : 'border-danger/40 bg-danger-soft/50 text-danger'
              )}
            >
              {testsPassed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>All automated exercise checks passed.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>One or more exercise assertions failed. Review the traceback below.</span>
                </>
              )}
            </div>
          )}
          {result?.stdout && (
            <pre className="whitespace-pre-wrap text-primary">{result.stdout}</pre>
          )}
          {result?.stderr && (
            <pre className="mt-2 whitespace-pre-wrap text-warning">{result.stderr}</pre>
          )}
          {errorMsg && (
            <div className="rounded-sm border border-danger/40 bg-danger-soft/40 p-3 text-danger">
              <p className="mb-1 font-sans text-xs font-semibold">
                Python Error {errorLine ? `(Line ${errorLine})` : ''}
              </p>
              <pre className="whitespace-pre-wrap text-xs">{errorMsg}</pre>
            </div>
          )}
        </div>
      )}

      {viewTab === 'plots' && (
        <div className="min-h-[180px] bg-surface p-4">
          {result && result.plots.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {result.plots.map((b64, idx) => (
                <figure key={idx} className="overflow-hidden rounded-sm border border-hairline bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${b64}`}
                    alt={`Generated plot ${idx + 1} from ${title}`}
                    className="h-auto w-full"
                  />
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-xs text-primary-muted">
              No matplotlib figures were generated yet. Call <code>plt.show()</code> in your code
              to display charts here.
            </p>
          )}
        </div>
      )}

      {/* Exercise hint ladder + solution reveal */}
      {levelTab === 'exercise' && (hint1 || hint2 || exerciseSolution) && (
        <div className="space-y-3 border-t border-hairline bg-subtle/60 px-4 py-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {hint1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHintStep((s) => (s >= 1 ? 0 : 1))}
              >
                <Lightbulb className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                {hintStep >= 1 ? 'Hide Hint 1' : 'Hint 1'}
              </Button>
            )}
            {hint2 && hintStep >= 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHintStep((s) => (s === 2 ? 1 : 2))}
              >
                <Lightbulb className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                {hintStep >= 2 ? 'Hide Hint 2' : 'Hint 2'}
              </Button>
            )}
            {exerciseSolution && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSolutionRevealed((prev) => !prev)}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                {solutionRevealed ? 'Hide Solution' : 'Reveal Solution'}
              </Button>
            )}
          </div>

          {hintStep >= 1 && hint1 && (
            <p className="rounded-sm border border-warning/30 bg-warning-soft/40 p-2.5 text-primary">
              <strong>Hint 1:</strong> {hint1}
            </p>
          )}
          {hintStep >= 2 && hint2 && (
            <p className="rounded-sm border border-warning/30 bg-warning-soft/40 p-2.5 text-primary">
              <strong>Hint 2:</strong> {hint2}
            </p>
          )}
          {solutionRevealed && exerciseSolution && (
            <div className="space-y-2 rounded-sm border border-hairline bg-surface p-3">
              <div className="flex items-center justify-between">
                <strong className="text-primary">Reference Solution</strong>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setBuffers((prev) => ({
                      ...prev,
                      exercise: exerciseSolution.trim(),
                    }));
                    setViewTab('code');
                  }}
                >
                  Load into Editor
                </Button>
              </div>
              <pre className="overflow-x-auto rounded bg-subtle p-2.5 font-mono text-[12px] text-primary">
                <code>{exerciseSolution.trim()}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

