import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmt, shortDate } from '../utils/helpers';

const EMPTY = { amount: '', category_id: '', description: '', expense_date: new Date().toISOString().slice(0, 10), is_recurring: false, recurring_frequency: 'monthly' };

export default function Expenses() {
  const { expenses, categories, addExpense, updateExpense, deleteExpense } = useBudget();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editing) await updateExpense(editing, payload);
      else await addExpense(payload);
      setForm(EMPTY); setEditing(null);
    } catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  const startEdit = (ex) => {
    setEditing(ex.id);
    setForm({
      amount: ex.amount, category_id: ex.category_id, description: ex.description ?? '',
      expense_date: ex.expense_date, is_recurring: ex.is_recurring, recurring_frequency: ex.recurring_frequency ?? 'monthly',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => { setEditing(null); setForm(EMPTY); };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Expenses</h1>

      {/* ── Form ─────────────────────────────────────── */}
      <form onSubmit={submit} className="card p-5 space-y-4 animate-fade-up">
        <h2 className="text-sm font-semibold">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
        {err && <p className="text-sm text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{err}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
            <input type="number" step="0.01" min="0" required placeholder="0.00"
              value={form.amount} onChange={(e) => set('amount', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <select required value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className="input-field">
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
            <input type="date" required value={form.expense_date} onChange={(e) => set('expense_date', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <input type="text" placeholder="e.g. Weekly groceries" value={form.description}
              onChange={(e) => set('description', e.target.value)} className="input-field" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_recurring} onChange={(e) => set('is_recurring', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
          Recurring expense
        </label>
        {form.is_recurring && (
          <select value={form.recurring_frequency} onChange={(e) => set('recurring_frequency', e.target.value)} className="input-field max-w-xs">
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? 'Saving…' : editing ? 'Update' : 'Add Expense'}
          </button>
          {editing && <button type="button" onClick={cancel} className="btn-secondary">Cancel</button>}
        </div>
      </form>

      {/* ── List ─────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-sm font-semibold">All Expenses</h3>
        </div>
        {expenses.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">Nothing here yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map((ex) => {
              const cat = catMap[ex.category_id];
              return (
                <div key={ex.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  <span className="text-lg">{cat?.icon ?? '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ex.description || cat?.name || 'Expense'}</p>
                    <p className="text-xs text-slate-400">{shortDate(ex.expense_date)}{ex.is_recurring ? ' · recurring' : ''}</p>
                  </div>
                  <span className="font-semibold text-sm font-mono">{fmt(ex.amount)}</span>
                  <button onClick={() => startEdit(ex)} className="text-xs text-brand-500 hover:underline">Edit</button>
                  <button onClick={() => { if (confirm('Delete this expense?')) deleteExpense(ex.id); }}
                    className="text-xs text-coral-500 hover:underline">Del</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
