import React,{useState,useRef,useEffect} from 'react';
import {useData} from '../context/DataContext';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../lib/supabase';
import {fmt,monthKey} from '../utils/helpers';

const INIT={id:0,role:'assistant',content:"Hi! I'm your AI financial & debt advisor. I can analyze your spending, suggest budget changes, and build a personalized debt payoff plan. Ask me anything!"};

const SUGGESTIONS=[
  'Analyze my spending this month',
  'How can I pay off my debt faster?',
  'Build me a debt payoff plan',
  'Where should I cut spending?',
  'Give me a full financial summary',
];

export default function AIAdvisor(){
  const {user,hhId}=useAuth();
  const {transactions,accounts,categories,budgets,spendByCategory,members,totals}=useData();
  const [msgs,setMsgs]=useState([INIT]);
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const endRef=useRef(null);
  const apiKey=import.meta.env.VITE_OPENAI_API_KEY;

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs]);

  const send=async(text)=>{
    if(!text?.trim()) return;
    const userMsg={id:Date.now(),role:'user',content:text.trim()};
    setMsgs(m=>[...m,userMsg]); setInput(''); setBusy(true); setErr(null);

    if(!apiKey){
      setMsgs(m=>[...m,{id:Date.now()+1,role:'assistant',content:'Add VITE_OPENAI_API_KEY to your .env file to enable the AI advisor.'}]);
      setBusy(false); return;
    }

    try{
      const t=totals();
      const byCat=spendByCategory();
      const mk=monthKey();
      const catMap=Object.fromEntries(categories.map(c=>[c.id,c]));
      const debtAccounts=accounts.filter(a=>a.account_type==='credit_card'||a.account_type==='loan');
      const incomeThisMonth=transactions.filter(tx=>tx.type==='credit'&&tx.transaction_date.slice(0,7)===mk).reduce((s,tx)=>s+Number(tx.amount),0);

      const summary=[
        `=== FINANCIAL SNAPSHOT ===`,
        `Checking: ${fmt(t.checking)} | Savings: ${fmt(t.savings)}`,
        `Total debt: ${fmt(Math.abs(t.debt))} | Monthly spending: ${fmt(t.monthlySpending)}`,
        `Monthly income (this month): ${fmt(incomeThisMonth)}`,
        ``,
        `=== DEBT ACCOUNTS ===`,
        debtAccounts.length===0?'No debt accounts.'
          :debtAccounts.map(a=>`• ${a.name}: Balance ${fmt(Math.abs(a.balance))}, ${a.interest_rate??0}% APR`).join('\n'),
        ``,
        `=== SPENDING BY CATEGORY (this month) ===`,
        byCat.map(c=>`• ${c.name}: Spent ${fmt(c.spent)}${c.budget?` / Budget ${fmt(c.budget)}`:''}` ).join('\n'),
        ``,
        `=== BUDGETS SET ===`,
        byCat.filter(c=>c.budget>0).map(c=>`• ${c.name}: ${fmt(c.budget)} limit, ${fmt(c.spent)} spent, ${c.spent>c.budget?'OVER BUDGET':'within budget'}`).join('\n')||'No budgets set.',
        ``,
        `=== RECENT TRANSACTIONS (last 15) ===`,
        transactions.slice(0,15).map(tx=>`${tx.transaction_date} | ${tx.type} | ${fmt(tx.amount)} | ${catMap[tx.category_id]?.name??'—'} | ${tx.description??''}`).join('\n'),
      ].join('\n');

      const system=`You are an expert personal finance and debt advisor. The user has shared their financial data below.

${summary}

RULES:
1. Give SPECIFIC, ACTIONABLE advice — not generic platitudes. Reference their actual numbers.
2. For debt questions: analyze their debt accounts, interest rates, and income. Recommend either Snowball (smallest balance first) or Avalanche (highest interest first) method. Provide a monthly payment plan with specific dollar amounts per account, and estimate a debt-free timeline.
3. For budget advice: identify categories where they're overspending vs budget, and suggest specific dollar amounts to cut.
4. For spending analysis: show where their money is going and identify the biggest opportunities.
5. Keep responses concise but actionable (under 200 words unless they ask for a detailed plan).
6. Format with clear sections and bullet points for readability.`;

      const res=await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body:JSON.stringify({
          model:'gpt-3.5-turbo',
          messages:[
            {role:'system',content:system},
            ...msgs.filter(m=>m.id!==0).slice(-8).map(({role,content})=>({role,content})),
            {role:'user',content:text.trim()},
          ],
          temperature:0.7, max_tokens:600,
        }),
      });
      if(!res.ok){const e=await res.json(); throw new Error(e.error?.message??'API error');}
      const data=await res.json();
      const reply=data.choices?.[0]?.message?.content??'Sorry, no response.';
      setMsgs(m=>[...m,{id:Date.now()+1,role:'assistant',content:reply}]);

      supabase.from('ai_conversations').insert({household_id:hhId,user_id:user.id,message:text.trim(),response:reply}).catch(()=>{});
    }catch(ex){setErr(ex.message);}finally{setBusy(false);}
  };

  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">AI Financial Advisor 🤖</h1>

    <div className="card flex flex-col" style={{height:'calc(100vh - 200px)',minHeight:350}}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map(m=><div key={m.id} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
          <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role==='user'?'bg-brand-500 text-white rounded-br-sm':'bg-slate-100 rounded-bl-sm'}`}>{m.content}</div>
        </div>)}
        {busy&&<div className="flex justify-start"><div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5"><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"/><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:.15s]"/><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:.3s]"/></div></div>}
        {err&&<p className="text-xs text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{err}</p>}
        <div ref={endRef}/>
      </div>
      <form onSubmit={e=>{e.preventDefault();send(input);}} className="border-t border-slate-100 p-3 flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} disabled={busy} placeholder="Ask about finances or debt…" className="field flex-1 !py-2"/>
        <button type="submit" disabled={busy||!input.trim()} className="btn-p !px-4 text-sm">Send</button>
      </form>
    </div>

    <div className="flex flex-wrap gap-1.5">{SUGGESTIONS.map(s=><button key={s} onClick={()=>send(s)} className="badge bg-brand-50 text-brand-600 hover:bg-brand-100 cursor-pointer py-1 px-2.5 text-xs">{s}</button>)}</div>
  </div>;
}
