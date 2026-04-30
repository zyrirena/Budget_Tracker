import React,{createContext,useContext,useEffect,useState,useCallback} from 'react';
import {supabase} from '../lib/supabase';
import {useAuth} from './AuthContext';
import {monthKey} from '../utils/helpers';

const Ctx = createContext(null);

export function DataProvider({children}){
  const {user,hhId} = useAuth();
  const [transactions,setTxns]   = useState([]);
  const [accounts,setAccounts]   = useState([]);
  const [categories,setCategories] = useState([]);
  const [budgets,setBudgets]     = useState([]);
  const [members,setMembers]     = useState([]);
  const [loading,setLoading]     = useState(false);

  /* ── fetchers ─────────────────────────────── */
  const fetchTxns = useCallback(async()=>{
    if(!hhId) return;
    const {data}=await supabase.from('transactions').select('*').eq('household_id',hhId).order('transaction_date',{ascending:false}).order('created_at',{ascending:false});
    setTxns(data??[]);
  },[hhId]);

  const fetchAccounts = useCallback(async()=>{
    if(!hhId) return;
    const {data}=await supabase.from('accounts').select('*').eq('household_id',hhId).eq('is_active',true).order('created_at');
    setAccounts(data??[]);
  },[hhId]);

  const fetchCategories = useCallback(async()=>{
    if(!hhId) return;
    const {data}=await supabase.from('categories').select('*').eq('household_id',hhId).order('name');
    if(data && data.length===0){ await seedCategories(); return; }
    setCategories(data??[]);
  },[hhId]);

  const fetchBudgets = useCallback(async()=>{
    if(!hhId) return;
    const {data}=await supabase.from('budgets').select('*').eq('household_id',hhId).order('month',{ascending:false});
    setBudgets(data??[]);
  },[hhId]);

  const fetchMembers = useCallback(async()=>{
    if(!hhId) return;
    const {data}=await supabase.from('household_members').select('*').eq('household_id',hhId);
    setMembers(data??[]);
  },[hhId]);

  const refresh = useCallback(async()=>{
    setLoading(true);
    await Promise.all([fetchTxns(),fetchAccounts(),fetchCategories(),fetchBudgets(),fetchMembers()]);
    setLoading(false);
  },[fetchTxns,fetchAccounts,fetchCategories,fetchBudgets,fetchMembers]);

  useEffect(()=>{ if(hhId) refresh(); },[hhId,refresh]);

  /* ── seed default categories ───────────────── */
  const seedCategories = async()=>{
    const defs = [
      {name:'Groceries',icon:'🛒',color:'#34d399',type:'expense'},
      {name:'Dining',icon:'🍽️',color:'#a78bfa',type:'expense'},
      {name:'Utilities',icon:'💡',color:'#f87171',type:'expense'},
      {name:'Transport',icon:'🚗',color:'#3384f5',type:'expense'},
      {name:'Entertainment',icon:'🎬',color:'#fbbf24',type:'expense'},
      {name:'Shopping',icon:'🛍️',color:'#f472b6',type:'expense'},
      {name:'Healthcare',icon:'🏥',color:'#60a5fa',type:'expense'},
      {name:'Subscriptions',icon:'📱',color:'#fb923c',type:'expense'},
      {name:'Salary',icon:'💵',color:'#059669',type:'income'},
      {name:'Other Income',icon:'💰',color:'#818cf8',type:'income'},
      {name:'Other',icon:'📌',color:'#94a3b8',type:'expense'},
    ];
    await supabase.from('categories').insert(defs.map(c=>({...c,household_id:hhId})));
    await fetchCategories();
  };

  /* ── mutations ─────────────────────────────── */
  const addTransaction = async(row)=>{
    const {error}=await supabase.from('transactions').insert({...row,household_id:hhId,user_id:user.id});
    if(error) throw error;
    // update account balance
    const delta = row.type==='debit' ? -Math.abs(row.amount) : Math.abs(row.amount);
    const acct = accounts.find(a=>a.id===row.account_id);
    if(acct) await supabase.from('accounts').update({balance: Number(acct.balance)+delta}).eq('id',acct.id);
    await Promise.all([fetchTxns(),fetchAccounts()]);
  };

  const deleteTransaction = async(txn)=>{
    await supabase.from('transactions').delete().eq('id',txn.id);
    const delta = txn.type==='debit' ? Math.abs(txn.amount) : -Math.abs(txn.amount);
    await supabase.from('accounts').update({balance: Number(accounts.find(a=>a.id===txn.account_id)?.balance??0)+delta}).eq('id',txn.account_id);
    await Promise.all([fetchTxns(),fetchAccounts()]);
  };

  const addAccount = async(row)=>{
    const {error}=await supabase.from('accounts').insert({...row,household_id:hhId});
    if(error) throw error; await fetchAccounts();
  };
  const updateAccount = async(id,row)=>{ await supabase.from('accounts').update(row).eq('id',id); await fetchAccounts(); };
  const deleteAccount = async(id)=>{ await supabase.from('accounts').update({is_active:false}).eq('id',id); await fetchAccounts(); };

  const addCategory = async(row)=>{
    const {error}=await supabase.from('categories').insert({...row,household_id:hhId});
    if(error) throw error; await fetchCategories();
  };
  const updateCategory = async(id,row)=>{ await supabase.from('categories').update(row).eq('id',id); await fetchCategories(); };
  const deleteCategory = async(id,reassignTo)=>{
    if(reassignTo) await supabase.from('transactions').update({category_id:reassignTo}).eq('category_id',id);
    await supabase.from('categories').delete().eq('id',id); await fetchCategories();
  };

  const upsertBudget = async(category_id,limit_amount,month)=>{
    const {error}=await supabase.from('budgets').upsert({household_id:hhId,category_id,limit_amount,month},{onConflict:'household_id,category_id,month'});
    if(error) throw error; await fetchBudgets();
  };

  /* ── derived ───────────────────────────────── */
  const totals = ()=>{
    const sum=(t)=>accounts.filter(a=>a.account_type===t).reduce((s,a)=>s+Number(a.balance),0);
    const mk=monthKey();
    const monthSpend = transactions.filter(t=>t.type==='debit'&&t.transaction_date.slice(0,7)===mk).reduce((s,t)=>s+Number(t.amount),0);
    return {checking:sum('checking'),savings:sum('savings'),debt:sum('credit_card')+sum('loan'),monthlySpending:monthSpend};
  };

  const spendByCategory = (month=monthKey())=>{
    const map={};
    transactions.filter(t=>t.type==='debit'&&t.transaction_date.slice(0,7)===month).forEach(t=>{
      map[t.category_id]=(map[t.category_id]??0)+Number(t.amount);
    });
    return categories.filter(c=>c.type==='expense').map(c=>({
      ...c, spent:map[c.id]??0,
      budget: budgets.find(b=>b.category_id===c.id&&b.month.slice(0,7)===month)?.limit_amount??0,
    })).filter(c=>c.spent>0||c.budget>0);
  };

  const spendByUser = (month=monthKey())=>{
    const map={};
    transactions.filter(t=>t.type==='debit'&&t.transaction_date.slice(0,7)===month).forEach(t=>{
      map[t.user_id]=(map[t.user_id]??0)+Number(t.amount);
    });
    return members.map(m=>({...m,spent:map[m.user_id]??0})).filter(m=>m.spent>0);
  };

  const spendByAccount = (month=monthKey())=>{
    const map={};
    transactions.filter(t=>t.type==='debit'&&t.transaction_date.slice(0,7)===month).forEach(t=>{
      map[t.account_id]=(map[t.account_id]??0)+Number(t.amount);
    });
    return accounts.map(a=>({...a,spent:map[a.id]??0})).filter(a=>a.spent>0);
  };

  return <Ctx.Provider value={{
    transactions,accounts,categories,budgets,members,loading,refresh,
    addTransaction,deleteTransaction,
    addAccount,updateAccount,deleteAccount,
    addCategory,updateCategory,deleteCategory,
    upsertBudget,totals,spendByCategory,spendByUser,spendByAccount,
  }}>{children}</Ctx.Provider>;
}
export const useData=()=>{ const c=useContext(Ctx); if(!c) throw new Error('useData outside provider'); return c; };
