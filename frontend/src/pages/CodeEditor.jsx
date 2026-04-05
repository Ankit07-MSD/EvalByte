import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const LANGS = ['Python', 'C', 'C++', 'Java'];

const DESKTOP_KEY = 'evalbyte_editor_split_desktop';
const MOBILE_KEY = 'evalbyte_editor_split_mobile';

const DEFAULTS = {
  Python: `name = input().strip()
print(f"Hello, {name}!")`,
  C: `#include <stdio.h>
int main() {
    char name[256];
    scanf("%255s", name);
    printf("Hello, %s!\\n", name);
    return 0;
}`,
  'C++': `#include <iostream>
#include <string>
using namespace std;
int main() {
    string name;
    cin >> name;
    cout << "Hello, " << name << "!" << endl;
    return 0;
}`,
  Java: `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.next();
        System.out.println("Hello, " + name + "!");
    }
}`,
};

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

function buildProblemCases(problem) {
  if (!problem) return [];
  const primary =
    (problem.expectedOutput ?? '').trim() !== ''
      ? [{ input: problem.input ?? '', expectedOutput: problem.expectedOutput }]
      : [];
  const extras = (problem.testCases || []).filter(
    (tc) => (tc.expectedOutput ?? '').trim() !== ''
  );
  return [...primary, ...extras];
}

function ProblemPanel({ problem, id }) {
  const cases = buildProblemCases(problem);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-800 pb-3">
        <Link to={`/problems/${id}`} className="text-xs text-brand-400 hover:underline">
          ← Full problem page
        </Link>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-400/90">
          {problem.difficulty}
        </p>
        <h2 className="mt-1 text-lg font-bold leading-snug text-white">{problem.title}</h2>
      </div>
      <div className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </h3>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {problem.description}
          </div>
        </section>
        {cases.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sample I/O
            </h3>
            <ul className="mt-2 space-y-3">
              {cases.map((tc, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs"
                >
                  <p className="font-medium text-slate-500">Case {i + 1}</p>
                  <p className="mt-1 text-slate-500">Input</p>
                  <pre className="mt-0.5 overflow-x-auto rounded bg-slate-900 p-2 text-slate-200">
                    {tc.input === '' ? '(empty)' : tc.input}
                  </pre>
                  <p className="mt-2 text-slate-500">Expected</p>
                  <pre className="mt-0.5 overflow-x-auto rounded bg-slate-900 p-2 text-emerald-200/90">
                    {tc.expectedOutput}
                  </pre>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export default function CodeEditor() {
  const { id } = useParams();
  const isLg = useMediaQuery('(min-width: 1024px)');

  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('Python');
  const [code, setCode] = useState(DEFAULTS.Python);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [splitDesktop, setSplitDesktop] = useState(() => {
    const n = Number(localStorage.getItem(DESKTOP_KEY));
    return Number.isFinite(n) && n >= 24 && n <= 58 ? n : 38;
  });
  const [splitMobile, setSplitMobile] = useState(() => {
    const n = Number(localStorage.getItem(MOBILE_KEY));
    return Number.isFinite(n) && n >= 28 && n <= 62 ? n : 42;
  });

  const splitDesktopRef = useRef(splitDesktop);
  splitDesktopRef.current = splitDesktop;

  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/api/problems/${id}`);
        if (!cancelled) setProblem(data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Problem not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDividerMouseDown = useCallback((e) => {
    if (!isLg) return;
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [isLg]);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.round((x / rect.width) * 100);
      const clamped = Math.min(Math.max(pct, 24), 58);
      setSplitDesktop(clamped);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem(DESKTOP_KEY, String(splitDesktopRef.current));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(MOBILE_KEY, String(splitMobile));
  }, [splitMobile]);

  const handleLanguageChange = (l) => {
    setLanguage(l);
    setCode(DEFAULTS[l]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/submissions', {
        problemId: id,
        language,
        sourceCode: code,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!problem) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200">
        {error || 'Not found'}
      </div>
    );
  }

  const sub = result?.submission;
  const statusClass =
    sub?.status === 'Accepted'
      ? 'text-emerald-400'
      : sub?.status === 'Wrong Answer'
        ? 'text-amber-400'
        : 'text-red-400';

  const problemPaneStyle = isLg
    ? {
        flex: `0 0 ${splitDesktop}%`,
        width: `${splitDesktop}%`,
        maxWidth: `${splitDesktop}%`,
        minWidth: 0,
      }
    : {
        flex: '0 0 auto',
        maxHeight: `${splitMobile}vh`,
        minHeight: '160px',
      };

  const editorPaneStyle = isLg
    ? { flex: '1 1 0%', minWidth: 0, minHeight: 0 }
    : { flex: '1 1 auto', minHeight: 'min(50vh, 360px)' };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <header className="shrink-0">
        <h1 className="text-xl font-bold text-white md:text-2xl">Solve: {problem.title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          The statement stays beside the editor on large screens. Drag the middle bar or use the
          slider to resize.
        </p>

        {isLg && (
          <div className="mt-3 flex items-center gap-3">
            <label htmlFor="split-desktop" className="shrink-0 text-xs text-slate-500">
              Question / editor width
            </label>
            <input
              id="split-desktop"
              type="range"
              min={24}
              max={58}
              value={splitDesktop}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSplitDesktop(v);
                localStorage.setItem(DESKTOP_KEY, String(v));
              }}
              className="h-2 w-full max-w-md cursor-pointer accent-brand-500"
            />
            <span className="w-10 text-right text-xs tabular-nums text-slate-400">
              {splitDesktop}%
            </span>
          </div>
        )}

        {!isLg && (
          <div className="mt-3 flex items-center gap-3">
            <label htmlFor="split-mobile" className="shrink-0 text-xs text-slate-500">
              Question height
            </label>
            <input
              id="split-mobile"
              type="range"
              min={28}
              max={62}
              value={splitMobile}
              onChange={(e) => setSplitMobile(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-brand-500"
            />
            <span className="w-10 text-right text-xs tabular-nums text-slate-400">
              {splitMobile}%
            </span>
          </div>
        )}
      </header>

      <div
        ref={containerRef}
        className="flex min-h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30 lg:min-h-[calc(100vh-9.5rem)] lg:flex-row"
      >
        <div
          className="flex min-h-0 flex-col border-slate-800 p-3 sm:p-4 lg:border-r-0 lg:pr-2"
          style={problemPaneStyle}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <ProblemPanel problem={problem} id={id} />
          </div>
        </div>

        <button
          type="button"
          aria-label="Drag to resize question and editor width"
          onMouseDown={handleDividerMouseDown}
          className="group relative hidden w-3 shrink-0 cursor-col-resize flex-col border-x border-slate-800 bg-slate-900 lg:flex"
        >
          <span className="pointer-events-none absolute inset-y-3 left-1/2 w-1 -translate-x-1/2 rounded-full bg-slate-600 transition group-hover:bg-brand-500 group-active:bg-brand-400" />
        </button>

        <div
          className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto p-3 sm:p-4 lg:pl-2"
          style={editorPaneStyle}
        >
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-slate-400">Language</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                {LANGS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="min-h-[220px] w-full flex-1 resize-y rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-relaxed text-slate-100 outline-none focus:border-brand-500 lg:min-h-[260px]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {submitting ? 'Running…' : 'Submit'}
            </button>
          </form>

          <aside className="shrink-0 space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h2 className="text-sm font-semibold text-slate-400">Result</h2>
            {error && (
              <div className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</div>
            )}
            {sub && (
              <div className="space-y-2 text-sm">
                <p className={`text-lg font-bold ${statusClass}`}>{sub.status}</p>
                <p className="text-slate-500">{result?.message}</p>
                {sub.output && (
                  <>
                    <p className="text-slate-500">Program output</p>
                    <pre className="max-h-40 overflow-auto rounded-lg bg-slate-950 p-2 text-xs text-slate-300">
                      {sub.output}
                    </pre>
                  </>
                )}
                {sub.judgeMessage && sub.status !== 'Accepted' && (
                  <>
                    <p className="text-slate-500">Details</p>
                    <pre className="max-h-32 overflow-auto rounded-lg bg-slate-950 p-2 text-xs text-slate-400">
                      {sub.judgeMessage}
                    </pre>
                  </>
                )}
              </div>
            )}
            {!sub && !error && (
              <p className="text-sm text-slate-500">Submit your code to see verdict here.</p>
            )}
            <Link to="/submissions" className="inline-block text-sm text-brand-400 hover:underline">
              View submission history →
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
