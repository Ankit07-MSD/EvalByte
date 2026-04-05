import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProblemDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <LoadingSpinner />;
  if (error || !problem) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200">
        {error || 'Not found'}
      </div>
    );
  }

  const primary =
    (problem.expectedOutput ?? '').trim() !== ''
      ? [{ input: problem.input ?? '', expectedOutput: problem.expectedOutput }]
      : [];
  const extras = (problem.testCases || []).filter(
    (tc) => (tc.expectedOutput ?? '').trim() !== ''
  );
  const cases = [...primary, ...extras];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-brand-400">{problem.difficulty}</p>
        <h1 className="mt-1 text-3xl font-bold text-white">{problem.title}</h1>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2>
        <div className="prose prose-invert mt-3 whitespace-pre-wrap text-slate-300">
          {problem.description}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Sample test cases
        </h2>
        <ul className="mt-4 space-y-4">
          {cases.map((tc, i) => (
            <li key={i} className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 text-sm">
              <p className="font-medium text-slate-400">Case {i + 1}</p>
              <p className="mt-2 text-slate-500">Input</p>
              <pre className="mt-1 overflow-x-auto rounded bg-slate-900 p-2 text-slate-200">
                {tc.input === '' ? '(empty)' : tc.input}
              </pre>
              <p className="mt-2 text-slate-500">Expected output</p>
              <pre className="mt-1 overflow-x-auto rounded bg-slate-900 p-2 text-emerald-200/90">
                {tc.expectedOutput}
              </pre>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        {isAuthenticated ? (
          <Link
            to={`/problems/${id}/solve`}
            className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500"
          >
            Open code editor
          </Link>
        ) : (
          <Link
            to="/login"
            state={{ from: `/problems/${id}/solve` }}
            className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500"
          >
            Log in to solve
          </Link>
        )}
        <Link
          to="/problems"
          className="rounded-xl border border-slate-600 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800"
        >
          Back to list
        </Link>
      </div>
    </div>
  );
}
