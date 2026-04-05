import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-10 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-500">
          Online coding practice
        </p>
        <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">Evalbyte</h1>
        <p className="mt-4 text-lg text-slate-400">
          Practice programming problems, submit solutions in C, C++, Java, or Python, and get
          instant feedback powered by Judge0.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/problems"
            className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500"
          >
            Browse problems
          </Link>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="rounded-xl border border-slate-600 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800"
            >
              Create account
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { t: 'Multi-language', d: 'C, C++, Java, Python with one editor.' },
          { t: 'Auto evaluation', d: 'Outputs checked against hidden-style test cases.' },
          { t: 'Your progress', d: 'Dashboard and submission history.' },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="font-semibold text-white">{x.t}</h3>
            <p className="mt-2 text-sm text-slate-400">{x.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
