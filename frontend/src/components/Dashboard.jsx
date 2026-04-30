import React from 'react';
import {useData} from '../context/DataContext';
import {fmt,shortDate,monthLabel,COLORS} from '../utils/helpers';
import {PieChart,Pie,Cell,BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts';

function Stat({label,value,icon,accent}){
  return <div className={`card p-4 border-l-4 ${accent} anim`}><p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</p><p className="text-xl font-bold mt-1">{value}</p></div>;
}

export default function Dashboard(){
  const {transactions,categories,accounts,totals,spendByCategory,spendByUser,spendByAccount,loading}=useData();
  const t=totals(); const byCat=spendByCategory(); const byUser=spendByUser(); const byAcc=spendByAccount();
  const catMap=Object.fromEntries(categories.map(c=>[c.id,c]));
  const recent=transactions.slice(0,5);

  if(loading) return <div className="flex justify-center py-20"><div className="animate-spin w-7 h-7 border-2 border-brand-400 border-t-transparent rounded-full"/></div>;

  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">{monthLabel()} Overview</h1>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat label="Checking" value={fmt(t.checking)} accent="border-brand-400"/>
      <Stat label="Savings"  value={fmt(t.savings)}  accent="border-mint-400"/>
      <Stat label="Debt"     value={fmt(Math.abs(t.debt))} accent="border-coral-400"/>
      <Stat label="Spent"    value={fmt(t.monthlySpending)} accent="border-yellow-400"/>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Spending by Category */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3">By Category</h3>
        {byCat.length?<ResponsiveContainer width="100%" height={200}><PieChart><Pie data={byCat} dataKey="spent" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>{byCat.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>fmt(v)}/></PieChart></ResponsiveContainer>:<p className="text-sm text-slate-400 py-10 text-center">No spending yet</p>}
      </div>

      {/* Spending by User */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3">By Household Member</h3>
        {byUser.length?<ResponsiveContainer width="100%" height={200}><BarChart data={byUser}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/><XAxis dataKey="display_name" tick={{fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/><Tooltip formatter={v=>fmt(v)}/><Bar dataKey="spent" fill="#3384f5" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>:<p className="text-sm text-slate-400 py-10 text-center">No data</p>}
      </div>
    </div>

    {/* Spending by Account */}
    {byAcc.length>0&&<div className="card p-4"><h3 className="text-sm font-semibold mb-3">By Account</h3>
      <div className="space-y-2">{byAcc.map(a=><div key={a.id} className="flex items-center gap-2"><span className="flex-1 text-sm">{a.name}</span><span className="text-sm font-semibold font-mono">{fmt(a.spent)}</span></div>)}</div>
    </div>}

    {/* Recent */}
    <div className="card overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex justify-between items-center"><h3 className="text-sm font-semibold">Recent Transactions</h3><span className="text-xs text-slate-400">{transactions.length} total</span></div>
      {recent.length===0?<p className="text-sm text-slate-400 py-8 text-center">Add your first transaction!</p>:
      <table className="w-full text-sm"><tbody>{recent.map(tx=>{const c=catMap[tx.category_id];return<tr key={tx.id} className="border-t border-slate-100"><td className="px-4 py-2.5"><span className="badge bg-slate-100 text-slate-600">{c?.icon} {c?.name??'—'}</span></td><td className="py-2.5 text-slate-500 hidden sm:table-cell">{tx.description||'—'}</td><td className="py-2.5 text-xs text-slate-400">{shortDate(tx.transaction_date)}</td><td className={`px-4 py-2.5 text-right font-semibold font-mono ${tx.type==='credit'?'text-mint-600':'text-slate-800'}`}>{tx.type==='credit'?'+':'−'}{fmt(tx.amount)}</td></tr>;})}</tbody></table>}
    </div>
  </div>;
}
