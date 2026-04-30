import React,{useMemo,useState} from 'react';
import {useData} from '../context/DataContext';
import {fmt,monthKey,COLORS} from '../utils/helpers';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from 'recharts';

export default function Reports(){
  const {transactions,categories,members,accounts}=useData();
  const [sel,setSel]=useState(monthKey());
  const catMap=Object.fromEntries(categories.map(c=>[c.id,c]));
  const memberMap=Object.fromEntries(members.map(m=>[m.user_id,m]));

  const months=useMemo(()=>{
    const list=[]; const d=new Date();
    for(let i=0;i<6;i++){const mk=monthKey(d); const label=d.toLocaleDateString('en-US',{month:'short',year:'2-digit'}); const total=transactions.filter(t=>t.type==='debit'&&t.transaction_date.slice(0,7)===mk).reduce((s,t)=>s+Number(t.amount),0); list.push({mk,label,total}); d.setMonth(d.getMonth()-1);}
    return list.reverse();
  },[transactions]);

  const monthTxns=transactions.filter(t=>t.type==='debit'&&t.transaction_date.slice(0,7)===sel);

  const byCat=useMemo(()=>{const m={}; monthTxns.forEach(t=>{m[t.category_id]=(m[t.category_id]??0)+Number(t.amount);}); return Object.entries(m).map(([id,amt])=>({name:catMap[id]?.name??'Other',icon:catMap[id]?.icon??'📌',amount:amt})).sort((a,b)=>b.amount-a.amount);},[monthTxns,catMap]);

  const byUser=useMemo(()=>{const m={}; monthTxns.forEach(t=>{m[t.user_id]=(m[t.user_id]??0)+Number(t.amount);}); return Object.entries(m).map(([id,amt])=>({name:memberMap[id]?.display_name??'Member',amount:amt})).sort((a,b)=>b.amount-a.amount);},[monthTxns,memberMap]);

  const byAcct=useMemo(()=>{const m={}; monthTxns.forEach(t=>{m[t.account_id]=(m[t.account_id]??0)+Number(t.amount);}); return Object.entries(m).map(([id,amt])=>{const a=accounts.find(x=>x.id===id); return {name:a?.name??'—',amount:amt};}).sort((a,b)=>b.amount-a.amount);},[monthTxns,accounts]);

  const total=monthTxns.reduce((s,t)=>s+Number(t.amount),0);

  const csv=()=>{
    const rows=[['Date','Category','Account','Who','Description','Amount']];
    monthTxns.forEach(t=>rows.push([t.transaction_date,catMap[t.category_id]?.name??'',accounts.find(a=>a.id===t.account_id)?.name??'',memberMap[t.user_id]?.display_name??'',t.description??'',t.amount]));
    const blob=new Blob([rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`expenses-${sel}.csv`; a.click();
  };

  return <div className="space-y-5">
    <div className="flex items-end justify-between flex-wrap gap-2">
      <h1 className="text-2xl font-bold">Reports</h1>
      <button onClick={csv} className="btn-s text-xs">⬇ CSV</button>
    </div>

    <div className="card p-4 anim">
      <h3 className="text-sm font-semibold mb-3">Monthly Trend</h3>
      <ResponsiveContainer width="100%" height={180}><BarChart data={months}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/><XAxis dataKey="label" tick={{fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/><Tooltip formatter={v=>fmt(v)}/><Bar dataKey="total" fill="#3384f5" radius={[4,4,0,0]} cursor="pointer" onClick={d=>setSel(d.mk)}/></BarChart></ResponsiveContainer>
      <p className="text-[11px] text-slate-400 text-center mt-1">Click a bar to view details</p>
    </div>

    <div className="flex items-center gap-2">
      <select value={sel} onChange={e=>setSel(e.target.value)} className="field !w-auto text-sm">{months.map(m=><option key={m.mk} value={m.mk}>{m.label}</option>)}</select>
      <span className="ml-auto text-sm font-semibold">Total: {fmt(total)}</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* By Category */}
      <div className="card overflow-hidden"><div className="px-4 pt-4 pb-2 text-sm font-semibold">By Category</div>
        {byCat.length===0?<p className="text-xs text-slate-400 p-4">No data</p>:<div className="divide-y divide-slate-100">{byCat.map((c,i)=>{const p=total?Math.round(c.amount/total*100):0; return<div key={i} className="px-4 py-2 flex items-center gap-2"><span>{c.icon}</span><div className="flex-1"><div className="flex justify-between text-xs mb-0.5"><span>{c.name}</span><span>{p}%</span></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{width:`${p}%`,background:COLORS[i%COLORS.length]}}/></div></div><span className="text-xs font-mono">{fmt(c.amount)}</span></div>;})}</div>}
      </div>

      {/* By User */}
      <div className="card overflow-hidden"><div className="px-4 pt-4 pb-2 text-sm font-semibold">By Member</div>
        {byUser.length===0?<p className="text-xs text-slate-400 p-4">No data</p>:<div className="divide-y divide-slate-100">{byUser.map((u,i)=><div key={i} className="px-4 py-2.5 flex justify-between"><span className="text-sm">{u.name}</span><span className="text-sm font-mono font-semibold">{fmt(u.amount)}</span></div>)}</div>}
      </div>

      {/* By Account */}
      <div className="card overflow-hidden"><div className="px-4 pt-4 pb-2 text-sm font-semibold">By Account</div>
        {byAcct.length===0?<p className="text-xs text-slate-400 p-4">No data</p>:<div className="divide-y divide-slate-100">{byAcct.map((a,i)=><div key={i} className="px-4 py-2.5 flex justify-between"><span className="text-sm">{a.name}</span><span className="text-sm font-mono font-semibold">{fmt(a.amount)}</span></div>)}</div>}
      </div>
    </div>
  </div>;
}
