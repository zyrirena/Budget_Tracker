import React,{useState,useMemo} from 'react';
import {useData} from '../context/DataContext';
import {useAuth} from '../context/AuthContext';
import {fmt,shortDate} from '../utils/helpers';

const EMPTY={amount:'',type:'debit',category_id:'',account_id:'',description:'',transaction_date:new Date().toISOString().slice(0,10),is_recurring:false,recur_frequency:'monthly'};

export default function Transactions(){
  const {user}=useAuth();
  const {transactions,categories,accounts,members,addTransaction,deleteTransaction}=useData();
  const [form,setForm]=useState(EMPTY);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const [showForm,setShowForm]=useState(false);
  // filters
  const [fAcct,setFAcct]=useState('');
  const [fCat,setFCat]=useState('');
  const [fUser,setFUser]=useState('');

  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const catMap=Object.fromEntries(categories.map(c=>[c.id,c]));
  const acctMap=Object.fromEntries(accounts.map(a=>[a.id,a]));
  const memberMap=Object.fromEntries(members.map(m=>[m.user_id,m]));

  const filtered=useMemo(()=>{
    let list=transactions;
    if(fAcct) list=list.filter(t=>t.account_id===fAcct);
    if(fCat) list=list.filter(t=>t.category_id===fCat);
    if(fUser) list=list.filter(t=>t.user_id===fUser);
    return list;
  },[transactions,fAcct,fCat,fUser]);

  // running balance per selected account
  const withBalance=useMemo(()=>{
    if(!fAcct) return filtered.map(t=>({...t,_bal:null}));
    const acct=accounts.find(a=>a.id===fAcct);
    let bal=Number(acct?.balance??0);
    // newest first, so we build from current balance backward
    return filtered.map(t=>{
      const row={...t,_bal:bal};
      bal += t.type==='debit'?Number(t.amount):-Number(t.amount);
      return row;
    });
  },[filtered,fAcct,accounts]);

  const submit=async e=>{
    e.preventDefault(); setBusy(true); setErr(null);
    try{
      await addTransaction({...form,amount:parseFloat(form.amount)});
      setForm(EMPTY); setShowForm(false);
    }catch(ex){setErr(ex.message);}finally{setBusy(false);}
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <button onClick={()=>setShowForm(s=>!s)} className="btn-p text-xs">{showForm?'Cancel':'+ Add'}</button>
    </div>

    {/* Form */}
    {showForm&&<form onSubmit={submit} className="card p-4 space-y-3 anim">
      {err&&<p className="text-xs text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-[11px] text-slate-500">Amount</label><input type="number" step="0.01" min="0" required value={form.amount} onChange={e=>set('amount',e.target.value)} className="field"/></div>
        <div><label className="text-[11px] text-slate-500">Type</label>
          <select value={form.type} onChange={e=>set('type',e.target.value)} className="field">
            <option value="debit">Debit (expense)</option><option value="credit">Credit (income)</option>
          </select></div>
        <div><label className="text-[11px] text-slate-500">Account</label>
          <select required value={form.account_id} onChange={e=>set('account_id',e.target.value)} className="field">
            <option value="">Select…</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select></div>
        <div><label className="text-[11px] text-slate-500">Category</label>
          <select required value={form.category_id} onChange={e=>set('category_id',e.target.value)} className="field">
            <option value="">Select…</option>{categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select></div>
        <div><label className="text-[11px] text-slate-500">Date</label><input type="date" required value={form.transaction_date} onChange={e=>set('transaction_date',e.target.value)} className="field"/></div>
        <div><label className="text-[11px] text-slate-500">Description</label><input value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Optional" className="field"/></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_recurring} onChange={e=>set('is_recurring',e.target.checked)} className="rounded"/>Recurring</label>
      {form.is_recurring&&<select value={form.recur_frequency} onChange={e=>set('recur_frequency',e.target.value)} className="field max-w-xs"><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>}
      <button disabled={busy} className="btn-p w-full">{busy?'Saving…':'Add Transaction'}</button>
    </form>}

    {/* Filters */}
    <div className="flex gap-2 flex-wrap">
      <select value={fAcct} onChange={e=>setFAcct(e.target.value)} className="field !w-auto text-xs"><option value="">All Accounts</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <select value={fCat} onChange={e=>setFCat(e.target.value)} className="field !w-auto text-xs"><option value="">All Categories</option>{categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
      <select value={fUser} onChange={e=>setFUser(e.target.value)} className="field !w-auto text-xs"><option value="">All Members</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.display_name||'Member'}</option>)}</select>
    </div>

    {/* Register */}
    <div className="card overflow-x-auto">
      {withBalance.length===0?<p className="text-sm text-slate-400 py-10 text-center">No transactions</p>:
      <table className="w-full text-sm min-w-[600px]"><thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="text-left px-3 py-2">Date</th><th className="text-left px-3">Description</th><th className="text-left px-3">Category</th><th className="text-left px-3">Account</th><th className="text-left px-3">Who</th><th className="text-right px-3">Amount</th>{fAcct&&<th className="text-right px-3">Balance</th>}<th/></tr></thead>
      <tbody>{withBalance.map(tx=>{const c=catMap[tx.category_id]; const m=memberMap[tx.user_id]; return<tr key={tx.id} className="border-t border-slate-100 hover:bg-slate-50/60">
        <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{shortDate(tx.transaction_date)}</td>
        <td className="px-3 py-2">{tx.description||'—'}{tx.is_recurring&&<span className="ml-1 text-[10px] text-brand-500">🔁</span>}</td>
        <td className="px-3 py-2"><span className="badge bg-slate-100 text-slate-600">{c?.icon} {c?.name??'—'}</span></td>
        <td className="px-3 py-2 text-slate-500">{acctMap[tx.account_id]?.name??'—'}</td>
        <td className="px-3 py-2 text-slate-500">{m?.display_name??'—'}</td>
        <td className={`px-3 py-2 text-right font-mono font-semibold ${tx.type==='credit'?'text-mint-600':''}`}>{tx.type==='credit'?'+':'−'}{fmt(tx.amount)}</td>
        {fAcct&&<td className="px-3 py-2 text-right font-mono text-slate-500">{fmt(tx._bal)}</td>}
        <td className="px-3 py-2"><button onClick={()=>{if(confirm('Delete?'))deleteTransaction(tx)}} className="text-xs text-coral-500 hover:underline">✕</button></td>
      </tr>;})}</tbody></table>}
    </div>
  </div>;
}
