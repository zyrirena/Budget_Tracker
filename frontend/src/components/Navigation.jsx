import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/',           label: 'Home',     icon: '📊' },
  { to: '/expenses',   label: 'Expenses', icon: '💸' },
  { to: '/accounts',   label: 'Accounts', icon: '🏦' },
  { to: '/budget',     label: 'Budget',   icon: '📈' },
  { to: '/reports',    label: 'Reports',  icon: '📋' },
  { to: '/ai',         label: 'Advisor',  icon: '🤖' },
];

const cls = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
  }`;

const mobileCls = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors ${
    isActive ? 'text-brand-600' : 'text-slate-500'
  }`;

export default function Navigation() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const handleOut = async () => { await signOut(); nav('/login'); };

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200/80 h-screen sticky top-0 p-5">
        <h1 className="text-2xl font-bold font-display mb-1 px-2">💰 Budget</h1>
        <p className="text-[10px] text-slate-400 tracking-wide uppercase mb-8 px-2">Finance Tracker</p>

        <nav className="flex-1 space-y-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={cls}>
              <span className="text-lg leading-none">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
          <p className="text-[11px] text-slate-400 truncate px-2">{user?.email}</p>
          <button onClick={handleOut} className="btn-secondary w-full text-xs !py-2">Sign Out</button>
        </div>
      </aside>

      {/* ── Mobile bottom bar ───────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200/80 flex justify-around safe-bottom">
        {links.slice(0, 5).map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={mobileCls}>
            <span className="text-xl leading-none">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
