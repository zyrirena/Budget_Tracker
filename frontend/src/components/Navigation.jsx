import React from 'react';
import {NavLink,useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
const L=[{to:'/',icon:'📊',label:'Home'},{to:'/transactions',icon:'💸',label:'Txns'},{to:'/accounts',icon:'🏦',label:'Accounts'},{to:'/budget',icon:'📈',label:'Budget'},{to:'/reports',icon:'📋',label:'Reports'},{to:'/ai',icon:'🤖',label:'Advisor'}];
const cl=({isActive})=>`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${isActive?'bg-brand-100 text-brand-700':'text-slate-600 hover:bg-slate-100'}`;
const mcl=({isActive})=>`flex flex-col items-center gap-0.5 text-[10px] font-medium ${isActive?'text-brand-600':'text-slate-500'}`;
export default function Nav(){
  const {user,signOut}=useAuth(); const nav=useNavigate();
  const out=async()=>{await signOut();nav('/login');};
  return<>
    {/* desktop */}
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-slate-200/80 h-screen sticky top-0 p-4">
      <h1 className="text-xl font-bold px-2 mb-6">💰 Budget</h1>
      <nav className="flex-1 space-y-1">{L.map(l=><NavLink key={l.to} to={l.to} end={l.to==='/'} className={cl}><span className="text-lg">{l.icon}</span>{l.label}</NavLink>)}</nav>
      <NavLink to="/categories" className={cl}><span className="text-lg">🏷️</span>Categories</NavLink>
      <div className="border-t border-slate-100 pt-3 mt-3"><p className="text-[11px] text-slate-400 truncate px-2 mb-2">{user?.email}</p><button onClick={out} className="btn-s w-full text-xs">Sign Out</button></div>
    </aside>
    {/* mobile */}
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 flex justify-around pb-[env(safe-area-inset-bottom)]">
      {L.slice(0,5).map(l=><NavLink key={l.to} to={l.to} end={l.to==='/'} className={mcl}><span className="text-xl">{l.icon}</span>{l.label}</NavLink>)}
    </nav>
  </>;
}
