import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get('/api/dashboard');
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200">{error}</div>
    );
  }

  const s = data.summary;

  const cards = [
    { label: 'Problems in platform', value: s.totalProblems },
    { label: 'Your submissions', value: s.totalSubmissions },
    { label: 'Accepted', value: s.accepted },
    { label: 'Wrong answer', value: s.wrongAnswer },
    { label: 'Errors / runtime', value: s.errors },
    { label: 'Unique solved', value: s.uniqueSolved },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance dashboard</h1>
        <p className="mt-2 text-slate-400">Overview of your practice activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-inner"
          >
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Recent submissions</h2>
        <ul className="mt-4 divide-y divide-slate-800">
          {data.recentSubmissions?.map((r) => (
            <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <Link
                  to={`/problems/${r.problemId?._id || r.problemId}`}
                  className="font-medium text-brand-400 hover:underline"
                >
                  {r.problemId?.title || 'Problem'}
                </Link>
                <span className="ml-2 text-slate-500">{r.language}</span>
              </div>
              <span
                className={
                  r.status === 'Accepted'
                    ? 'text-emerald-400'
                    : r.status === 'Wrong Answer'
                      ? 'text-amber-400'
                      : 'text-red-400'
                }
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
        {(!data.recentSubmissions || data.recentSubmissions.length === 0) && (
          <p className="text-sm text-slate-500">No activity yet.</p>
        )}
      </section>
    </div>
  );
}
