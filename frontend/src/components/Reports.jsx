import React, { useMemo, useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmt, monthKey, CATEGORY_COLORS } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const { expenses, categories } = useBudget();
  const [selectedMonth, setSelectedMonth] = useState(monthKey());

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  /* ── Build monthly history (last 6 months) ─── */
  const months = useMemo(() => {
    const list = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const mk = monthKey(d);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const total = expenses.filter((e) => e.expense_date.slice(0, 7) === mk).reduce((s, e) => s + Number(e.amount), 0);
      list.push({ mk, label, total });
      d.setMonth(d.getMonth() - 1);
    }
    return list.reverse();
  }, [expenses]);

  /* ── Breakdown for selected month ──────────── */
  const breakdown = useMemo(() => {
    const map = {};
    expenses.filter((e) => e.expense_date.slice(0, 7) === selectedMonth).forEach((e) => {
      map[e.category_id] = (map[e.category_id] ?? 0) + Number(e.amount);
    });
    return Object.entries(map)
      .map(([id, amount]) => ({ id, name: catMap[id]?.name ?? 'Other', icon: catMap[id]?.icon ?? '📌', amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, selectedMonth, catMap]);

  const totalSelected = breakdown.reduce((s, c) => s + c.amount, 0);

  /* ── CSV export ────────────────────────────── */
  const downloadCSV = () => {
    const rows = [['Date', 'Category', 'Description', 'Amount']];
    expenses.filter((e) => e.expense_date.slice(0, 7) === selectedMonth).forEach((e) => {
      rows.push([e.expense_date, catMap[e.category_id]?.name ?? 'Other', e.description ?? '', e.amount]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `expenses-${selectedMonth}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Spending trends & exports</p>
        </div>
        <button onClick={downloadCSV} className="btn-secondary text-xs">⬇ Export CSV</button>
      </div>

      {/* ── Trend chart ──────────────────────────── */}
      <div className="card p-5 animate-fade-up">
        <h3 className="text-sm font-semibold mb-4">Monthly Spending Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={months}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="total" fill="#3a9fff" radius={[5,5,0,0]}
              onClick={(d) => setSelectedMonth(d.mk)} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-2 text-center">Click a bar to view details</p>
      </div>

      {/* ── Month selector ───────────────────────── */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-slate-500">Month:</label>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input-field !w-auto !py-2 text-sm">
          {months.map((m) => <option key={m.mk} value={m.mk}>{m.label}</option>)}
        </select>
        <span className="ml-auto text-sm font-semibold">Total: {fmt(totalSelected)}</span>
      </div>

      {/* ── Breakdown ────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-sm font-semibold">Category Breakdown</h3>
        </div>
        {breakdown.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">No expenses for this month</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {breakdown.map((c, i) => {
              const p = totalSelected ? Math.round((c.amount / totalSelected) * 100) : 0;
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-lg">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-slate-500">{p}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: color }} />
                    </div>
                  </div>
                  <span className="font-semibold text-sm font-mono w-20 text-right">{fmt(c.amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
