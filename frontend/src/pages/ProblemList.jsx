import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const difficultyColors = {
  Easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Hard: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/problems');
        if (!cancelled) setProblems(data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load problems');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading problems…" />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200">{error}</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Problems</h1>
      <p className="mt-2 text-slate-400">Pick a challenge and open the editor to submit code.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {problems.map((p) => (
          <Link
            key={p._id}
            to={`/problems/${p._id}`}
            className="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-brand-600/50 hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-white group-hover:text-brand-400">{p.title}</h2>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                  difficultyColors[p.difficulty] || difficultyColors.Easy
                }`}
              >
                {p.difficulty}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.description}</p>
          </Link>
        ))}
      </div>

      {problems.length === 0 && (
        <p className="mt-8 text-slate-500">No problems yet. Ask an admin to add some.</p>
      )}
    </div>
  );
}
