import { useEffect, useState } from 'react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const emptyForm = () => ({
  title: '',
  description: '',
  input: '',
  expectedOutput: '',
  difficulty: 'Easy',
  testCases: [],
});

export default function AdminPanel() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/api/problems');
    setProblems(data);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      title: p.title,
      description: p.description,
      input: p.input ?? '',
      expectedOutput: p.expectedOutput ?? '',
      difficulty: p.difficulty,
      testCases: (p.testCases || []).map((tc) => ({
        input: tc.input ?? '',
        expectedOutput: tc.expectedOutput ?? '',
      })),
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const addTestRow = () => {
    setForm((f) => ({
      ...f,
      testCases: [...f.testCases, { input: '', expectedOutput: '' }],
    }));
  };

  const updateTestRow = (i, field, value) => {
    setForm((f) => {
      const next = [...f.testCases];
      next[i] = { ...next[i], [field]: value };
      return { ...f, testCases: next };
    });
  };

  const removeTestRow = (i) => {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.filter((_, idx) => idx !== i),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        input: form.input,
        expectedOutput: form.expectedOutput,
        difficulty: form.difficulty,
        testCases: form.testCases.filter((tc) => tc.expectedOutput.trim() !== ''),
      };
      if (editingId) {
        await api.put(`/api/problems/${editingId}`, payload);
        setMessage('Problem updated.');
      } else {
        await api.post('/api/problems', payload);
        setMessage('Problem created.');
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return;
    try {
      await api.delete(`/api/problems/${id}`);
      setMessage('Problem deleted.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin panel</h1>
        <p className="mt-2 text-slate-400">Manage problems, difficulty, and test cases.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">
          {editingId ? 'Edit problem' : 'Add problem'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm text-slate-400">Title</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Difficulty</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                {['Easy', 'Medium', 'Hard'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-slate-400">Description</label>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Default input (stdin)</label>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
                value={form.input}
                onChange={(e) => setForm({ ...form, input: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Default expected output</label>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
                value={form.expectedOutput}
                onChange={(e) => setForm({ ...form, expectedOutput: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">Extra test cases</h3>
              <button
                type="button"
                onClick={addTestRow}
                className="text-sm text-brand-400 hover:underline"
              >
                + Add row
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Primary expected output (above) is always checked first when set. Each extra row adds
              another case; all must pass for Accepted.
            </p>
            <div className="mt-3 space-y-3">
              {form.testCases.map((tc, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 sm:grid-cols-2"
                >
                  <div>
                    <label className="text-xs text-slate-500">Input</label>
                    <textarea
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-white"
                      value={tc.input}
                      onChange={(e) => updateTestRow(i, 'input', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Expected output</label>
                    <textarea
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-white"
                      value={tc.expectedOutput}
                      onChange={(e) => updateTestRow(i, 'expectedOutput', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => removeTestRow(i)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-slate-600 px-5 py-2 text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">All problems</h2>
        <div className="mt-4 space-y-3">
          {problems.map((p) => (
            <div
              key={p._id}
              className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-white">{p.title}</p>
                <p className="text-sm text-slate-500">
                  {p.difficulty} · {p.testCases?.length || 0} extra cases
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p._id)}
                  className="rounded-lg border border-red-900/50 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/40"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
