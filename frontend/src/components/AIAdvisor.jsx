import React, { useState, useRef, useEffect } from 'react';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { fmt, monthKey } from '../utils/helpers';

const INITIAL = {
  id: 0, role: 'assistant',
  content: 'Hey there! I\'m your AI financial advisor. Ask me anything about your spending, budgets, or savings strategy.',
};

const SUGGESTIONS = [
  'Analyze my spending this month',
  'How can I save more money?',
  'Which category am I overspending on?',
  'Give me a monthly financial summary',
];

export default function AIAdvisor() {
  const { user } = useAuth();
  const { expenses, accounts, categories, totals, spendingByCategory } = useBudget();
  const [messages, setMessages] = useState([INITIAL]);
  const [input, setInput]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState(null);
  const endRef = useRef(null);

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    if (!text?.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput(''); setBusy(true); setErr(null);

    if (!apiKey) {
      setMessages((m) => [...m, {
        id: Date.now() + 1, role: 'assistant',
        content: 'The AI advisor needs an OpenAI API key. Add VITE_OPENAI_API_KEY to your .env file and restart the app.',
      }]);
      setBusy(false); return;
    }

    try {
      const t = totals();
      const byCat = spendingByCategory();
      const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

      const summary = [
        `Checking: ${fmt(t.checking)}, Savings: ${fmt(t.savings)}, Debt: ${fmt(Math.abs(t.debt))}, Monthly spending: ${fmt(t.monthlySpending)}.`,
        `Category breakdown this month: ${byCat.map((c) => `${c.name}: ${fmt(c.spent)}${c.budget ? ` (budget ${fmt(c.budget)})` : ''}`).join('; ')}.`,
        `Recent expenses: ${expenses.slice(0, 8).map((e) => `${fmt(e.amount)} ${catMap[e.category_id]?.name ?? ''} (${e.expense_date})`).join('; ')}.`,
      ].join('\n');

      const system = `You are a friendly, concise financial advisor. The user's data:\n${summary}\nGive actionable advice in under 120 words. Use plain language.`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: system },
            ...messages.filter((m) => m.role !== 'system').slice(-8).map(({ role, content }) => ({ role, content })),
            { role: 'user', content: text.trim() },
          ],
          temperature: 0.7,
          max_tokens: 400,
        }),
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message ?? 'API error'); }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I couldn\u2019t generate a response.';

      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', content: reply }]);

      // persist to supabase (fire-and-forget)
      supabase.from('ai_conversations').insert({
        user_id: user.id, message: text.trim(), response: reply,
        tokens_used: data.usage?.total_tokens, conversation_type: 'general',
      }).catch(() => {});
    } catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold font-display">AI Advisor</h1>

      {/* Chat window */}
      <div className="card flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-500 text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-800 rounded-bl-md'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:.15s]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:.3s]" />
              </div>
            </div>
          )}
          {err && <p className="text-xs text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{err}</p>}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-slate-100 p-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} disabled={busy}
            placeholder="Ask about your finances…" className="input-field !py-2.5 flex-1" />
          <button type="submit" disabled={busy || !input.trim()} className="btn-primary !px-4 !py-2.5 text-sm">Send</button>
        </form>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)}
            className="badge bg-brand-50 text-brand-600 hover:bg-brand-100 transition cursor-pointer text-xs py-1.5 px-3">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
