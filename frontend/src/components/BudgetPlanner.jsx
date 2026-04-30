import React,{useState} from 'react';
import {useData} from '../context/DataContext';
import {fmt,pct,monthKey,monthLabel,COLORS} from '../utils/helpers';

export default function BudgetPlanner(){
  const {categories,spendByCategory,upsertBudget}=useData();
  const [drafts,setDrafts]=useState({});
  const [saving,setSaving]=useState(null);
  const data=spendByCategory(); const mk=monthKey();

  const save=async(catId)=>{
    const val=parseFloat(drafts[catId]); if(isNaN(val)||val<0) return;
    setSaving(catId);
    try{await upsertBudget(catId,val,`${mk}-01`);setDrafts(p=>({...p,[catId]:undefined}));}finally{setSaving(null);}
  };

  const totalBudget=data.reduce((s,c)=>s+c.budget,0);
  const totalSpent=data.reduce((s,c)=>s+c.spent,0);
  const tp=pct(totalSpent,totalBudget);

  // budget alerts
  const alerts=data.filter(c=>c.budget>0).map(c=>{
    const p=pct(c.spent,c.budget);
    if(p>=100) return {cat:c,msg:`You exceeded your ${c.name} budget by ${fmt(c.spent-c.budget)}`,level:'red'};
    if(p>=80) return {cat:c,msg:`You're close to exceeding your ${c.name} budget (${p}% used)`,level:'yellow'};
    return null;
  }).filter(Boolean);

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Budget</h1><p className="text-sm text-slate-500">{monthLabel()}</p></div>

    {/* Alerts */}
    {alerts.length>0&&<div className="space-y-2">{alerts.map((a,i)=><div key={i} className={`card p-3 text-sm border-l-4 ${a.level==='red'?'border-coral-400 bg-coral-100/50 text-coral-700':'border-yellow-400 bg-yellow-50 text-yellow-800'}`}>⚠️ {a.msg}</div>)}</div>}

    {/* Overall */}
    {totalBudget>0&&<div className="card p-4 anim">
      <div className="flex items-end justify-between mb-2">
        <div><p className="text-xs text-slate-500 font-medium">Overall</p><p className="text-xl font-bold">{fmt(totalSpent)} <span className="text-sm font-normal text-slate-400">/ {fmt(totalBudget)}</span></p></div>
        <span className={`text-sm font-semibold ${tp>=100?'text-coral-600':tp>=80?'text-yellow-600':'text-mint-600'}`}>{tp}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full transition-all ${tp>=100?'bg-coral-400':tp>=80?'bg-yellow-400':'bg-mint-400'}`} style={{width:`${Math.min(tp,100)}%`}}/></div>
    </div>}

    {/* Per-category */}
    <div className="space-y-3">{categories.filter(c=>c.type==='expense').map((cat,idx)=>{
      const row=data.find(d=>d.id===cat.id);
      const spent=row?.spent??0; const budget=row?.budget??0;
      const p=pct(spent,budget);
      const color=budget>0?(p>=100?'#f87171':p>=80?'#fbbf24':'#34d399'):COLORS[idx%COLORS.length];
      const dv=drafts[cat.id];
      return <div key={cat.id} className="card p-3 anim" style={{animationDelay:`${idx*30}ms`}}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{cat.icon}</span><span className="text-sm font-semibold flex-1">{cat.name}</span>
          {budget>0&&<span className={`text-xs font-semibold ${p>=100?'text-coral-600':p>=80?'text-yellow-600':'text-mint-600'}`}>{fmt(spent)} / {fmt(budget)} ({p}%)</span>}
          {budget===0&&spent>0&&<span className="text-xs text-slate-400">Spent {fmt(spent)}</span>}
        </div>
        {budget>0&&<>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2"><div className="h-full rounded-full transition-all" style={{width:`${Math.min(p,100)}%`,background:color}}/></div>
          <div className="flex justify-between text-[11px] text-slate-500"><span>Remaining: {fmt(Math.max(budget-spent,0))}</span></div>
        </>}
        <div className="flex gap-2 items-center mt-2">
          <input type="number" step="1" min="0" placeholder={budget>0?budget:'Set limit…'} value={dv??''} onChange={e=>setDrafts(p=>({...p,[cat.id]:e.target.value}))} className="field !py-1.5 text-sm flex-1 max-w-[140px]"/>
          <button onClick={()=>save(cat.id)} disabled={saving===cat.id||!dv} className="btn-p !py-1.5 text-xs">{saving===cat.id?'…':'Set'}</button>
        </div>
      </div>;
    })}</div>
  </div>;
}
