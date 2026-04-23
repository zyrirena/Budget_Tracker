import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmt, shortDate, CATEGORY_COLORS, currentMonthLabel } from '../utils/helpers';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/* ── Stat card ──────────────────────────────────────── */
function Stat({ label, value, icon, accent }) {
  return (
    <div className={`card p-5 border-l-4 ${accent} animate-fade-up`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1 font-display">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { expenses, categories, totals, spendingByCategory, loading } = useBudget();
  const t = totals();
  const byCategory = spendingByCategory();

  const pieData   = byCategory.filter((c) => c.spent > 0);
  const barData   = byCategory.filter((c) => c.budget > 0);
  const recent    = expenses.slice(0, 6);
  const catMap    = Object.fromEntries(categories.map((c) => [c.id, c]));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">{currentMonthLabel()} overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Checking"     value={fmt(t.checking)}      icon="🏦" accent="border-brand-400" />
        <Stat label="Savings"      value={fmt(t.savings)}       icon="💰" accent="border-mint-400" />
        <Stat label="Debt"         value={fmt(Math.abs(t.debt))} icon="💳" accent="border-coral-400" />
        <Stat label="This Month"   value={fmt(t.monthlySpending)} icon="📊" accent="border-yellow-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart — spending by category */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Spending by Category</h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="spent" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="h-[240px] flex items-center justify-center text-sm text-slate-400">No spending data yet</p>
          )}
          {pieData.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {pieData.map((c, i) => (
                <span key={c.id} className="badge text-[11px]" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] + '22', color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}>
                  {c.name}: {fmt(c.spent)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bar chart — budget vs actual */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Budget vs Actual</h3>
          {barData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="spent"  name="Spent"  fill="#3a9fff" radius={[4,4,0,0]} />
                <Bar dataKey="budget" name="Budget" fill="#5cc9a7" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="h-[240px] flex items-center justify-center text-sm text-slate-400">Set budgets to see comparison</p>
          )}
        </div>
      </div>

      {/* Recent expenses */}
      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Expenses</h3>
          <span className="text-xs text-slate-400">{expenses.length} total</span>
        </div>
        {recent.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">No expenses yet — add your first one!</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {recent.map((ex) => {
                const cat = catMap[ex.category_id];
                return (
                  <tr key={ex.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <span className="badge bg-slate-100 text-slate-600">{cat?.icon ?? '📌'} {cat?.name ?? 'Other'}</span>
                    </td>
                    <td className="py-3 text-slate-600 hidden sm:table-cell">{ex.description || '—'}</td>
                    <td className="py-3 text-slate-400 text-xs">{shortDate(ex.expense_date)}</td>
                    <td className="px-5 py-3 text-right font-semibold font-mono">{fmt(ex.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
