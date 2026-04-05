import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const item =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white';
const activeItem = 'bg-slate-800 text-white';

export default function Sidebar() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-slate-900/50 lg:block">
      <div className="sticky top-20 space-y-1 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Menu
        </p>
        <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? activeItem : ''}`}>
          Home
        </NavLink>
        <NavLink
          to="/problems"
          className={({ isActive }) => `${item} ${isActive ? activeItem : ''}`}
        >
          Problems
        </NavLink>
        {isAuthenticated && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `${item} ${isActive ? activeItem : ''}`}
            >
              Performance
            </NavLink>
            <NavLink
              to="/submissions"
              className={({ isActive }) => `${item} ${isActive ? activeItem : ''}`}
            >
              History
            </NavLink>
          </>
        )}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `${item} ${isActive ? activeItem : ''}`}
          >
            Admin panel
          </NavLink>
        )}
      </div>
    </aside>
  );
}
