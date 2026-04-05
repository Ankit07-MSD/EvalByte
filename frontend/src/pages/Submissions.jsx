import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function statusBadge(status) {
  if (status === 'Accepted') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (status === 'Wrong Answer') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  return 'bg-red-500/20 text-red-300 border-red-500/30';
}

export default function Submissions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/submissions/user');
        if (!cancelled) setList(data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load submissions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading history…" />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200">{error}</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Submission history</h1>
      <p className="mt-2 text-slate-400">Recent runs across all problems.</p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Problem</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/40">
            {list.map((s) => (
              <tr key={s._id} className="hover:bg-slate-900/50">
                <td className="px-4 py-3 text-slate-500">
                  {new Date(s.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/problems/${s.problemId?._id || s.problemId}`}
                    className="text-brand-400 hover:underline"
                  >
                    {s.problemId?.title || 'Problem'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300">{s.language}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge(s.status)}`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {list.length === 0 && (
        <p className="mt-8 text-slate-500">No submissions yet. Solve a problem from the list.</p>
      )}
    </div>
  );
}
