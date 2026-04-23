import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmt } from '../utils/helpers';

const TYPES = [
  { value: 'checking',    label: 'Checking',    icon: '🏦', accent: 'border-brand-400' },
  { value: 'savings',     label: 'Savings',     icon: '💰', accent: 'border-mint-400' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳', accent: 'border-coral-400' },
  { value: 'loan',        label: 'Loan',        icon: '📄', accent: 'border-yellow-400' },
];

const EMPTY = { name: '', account_type: 'checking', balance: '', note: '' };

export default function AccountManager() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useBudget();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const payload = { ...form, balance: parseFloat(form.balance || 0) };
      if (editing) await updateAccount(editing, payload);
      else await addAccount(payload);
      setForm(EMPTY); setEditing(null);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  const startEdit = (a) => {
    setEditing(a.id);
    setForm({ name: a.name, account_type: a.account_type, balance: a.balance, note: a.note ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const grouped = TYPES.map((t) => ({
    ...t,
    accounts: accounts.filter((a) => a.account_type === t.value),
    total: accounts.filter((a) => a.account_type === t.value).reduce((s, a) => s + Number(a.balance), 0),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Accounts</h1>

      {/* ── Form ──────────────────────────────────── */}
      <form onSubmit={submit} className="card p-5 space-y-4 animate-fade-up">
        <h2 className="text-sm font-semibold">{editing ? 'Edit Account' : 'Add Account'}</h2>
        {err && <p className="text-sm text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{err}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
            <input required placeholder="e.g. Main Checking" value={form.name}
              onChange={(e) => set('name', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
            <select value={form.account_type} onChange={(e) => set('account_type', e.target.value)} className="input-field">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Balance</label>
            <input type="number" step="0.01" placeholder="0.00" value={form.balance}
              onChange={(e) => set('balance', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Note</label>
            <input placeholder="Optional" value={form.note}
              onChange={(e) => set('note', e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? 'Saving…' : editing ? 'Update' : 'Add Account'}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="btn-secondary">Cancel</button>}
        </div>
      </form>

      {/* ── Grouped list ──────────────────────────── */}
      {grouped.map((g) => (
        <div key={g.value} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{g.icon}</span>
            <h3 className="text-sm font-semibold flex-1">{g.label}</h3>
            <span className="text-xs font-mono text-slate-500">Total: {fmt(g.total)}</span>
          </div>
          {g.accounts.length === 0 ? (
            <p className="text-xs text-slate-400 pl-8">No {g.label.toLowerCase()} accounts</p>
          ) : (
            <div className="space-y-2">
              {g.accounts.map((a) => (
                <div key={a.id} className={`card p-4 border-l-4 ${g.accent} flex items-center gap-3`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    {a.note && <p className="text-xs text-slate-400 truncate">{a.note}</p>}
                  </div>
                  <span className="font-bold font-mono text-sm">{fmt(a.balance)}</span>
                  <button onClick={() => startEdit(a)} className="text-xs text-brand-500 hover:underline">Edit</button>
                  <button onClick={() => { if (confirm('Remove this account?')) deleteAccount(a.id); }}
                    className="text-xs text-coral-500 hover:underline">Del</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
