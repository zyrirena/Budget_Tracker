import React,{useState} from 'react';
import {useData} from '../context/DataContext';
import {fmt} from '../utils/helpers';
const TYPES=[{v:'checking',l:'Checking',i:'🏦',a:'border-brand-400'},{v:'savings',l:'Savings',i:'💰',a:'border-mint-400'},{v:'credit_card',l:'Credit Card',i:'💳',a:'border-coral-400'},{v:'loan',l:'Loan',i:'📄',a:'border-yellow-400'}];
const EMPTY={name:'',account_type:'checking',balance:'',interest_rate:'',note:''};
export default function AccountManager(){
  const {accounts,addAccount,updateAccount,deleteAccount}=useData();
  const [form,setForm]=useState(EMPTY); const [editing,setEditing]=useState(null);
  const [busy,setBusy]=useState(false); const [err,setErr]=useState(null);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const submit=async e=>{e.preventDefault();setBusy(true);setErr(null);
    try{
      const payload={...form,balance:parseFloat(form.balance||0),interest_rate:parseFloat(form.interest_rate||0)};
      if(editing) await updateAccount(editing,payload); else await addAccount(payload);
      setForm(EMPTY);setEditing(null);
    }catch(ex){setErr(ex.message);}finally{setBusy(false);}};
  const edit=a=>{setEditing(a.id);setForm({name:a.name,account_type:a.account_type,balance:a.balance,interest_rate:a.interest_rate??'',note:a.note??''});window.scrollTo({top:0,behavior:'smooth'});};
  const grouped=TYPES.map(t=>({...t,items:accounts.filter(a=>a.account_type===t.v),total:accounts.filter(a=>a.account_type===t.v).reduce((s,a)=>s+Number(a.balance),0)}));
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Accounts</h1>
    <form onSubmit={submit} className="card p-4 space-y-3 anim">
      <h2 className="text-sm font-semibold">{editing?'Edit Account':'Add Account'}</h2>
      {err&&<p className="text-xs text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-[11px] text-slate-500">Name</label><input required value={form.name} onChange={e=>set('name',e.target.value)} className="field"/></div>
        <div><label className="text-[11px] text-slate-500">Type</label><select value={form.account_type} onChange={e=>set('account_type',e.target.value)} className="field">{TYPES.map(t=><option key={t.v} value={t.v}>{t.i} {t.l}</option>)}</select></div>
        <div><label className="text-[11px] text-slate-500">Balance</label><input type="number" step="0.01" value={form.balance} onChange={e=>set('balance',e.target.value)} className="field"/></div>
        <div><label className="text-[11px] text-slate-500">Interest Rate %</label><input type="number" step="0.01" min="0" value={form.interest_rate} onChange={e=>set('interest_rate',e.target.value)} placeholder="0" className="field"/></div>
      </div>
      <div><label className="text-[11px] text-slate-500">Note</label><input value={form.note} onChange={e=>set('note',e.target.value)} className="field"/></div>
      <div className="flex gap-2"><button disabled={busy} className="btn-p flex-1">{busy?'Saving…':editing?'Update':'Add'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(EMPTY);}} className="btn-s">Cancel</button>}</div>
    </form>
    {grouped.map(g=><div key={g.v} className="space-y-2">
      <div className="flex items-center gap-2"><span className="text-lg">{g.i}</span><h3 className="text-sm font-semibold flex-1">{g.l}</h3><span className="text-xs font-mono text-slate-500">{fmt(g.total)}</span></div>
      {g.items.length===0?<p className="text-xs text-slate-400 pl-8">None</p>:g.items.map(a=><div key={a.id} className={`card p-3 border-l-4 ${g.a} flex items-center gap-3`}>
        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{a.name}</p>{a.interest_rate>0&&<p className="text-[11px] text-slate-400">{a.interest_rate}% APR</p>}{a.note&&<p className="text-xs text-slate-400 truncate">{a.note}</p>}</div>
        <span className="font-bold font-mono text-sm">{fmt(a.balance)}</span>
        <button onClick={()=>edit(a)} className="text-xs text-brand-500 hover:underline">Edit</button>
        <button onClick={()=>{if(confirm('Remove?'))deleteAccount(a.id)}} className="text-xs text-coral-500 hover:underline">Del</button>
      </div>)}
    </div>)}
  </div>;
}
