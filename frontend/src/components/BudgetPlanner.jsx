import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmt, pct, monthKey, currentMonthLabel, CATEGORY_COLORS } from '../utils/helpers';

export default function BudgetPlanner() {
  const { categories, spendingByCategory, upsertBudget } = useBudget();
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(null);

  const data = spendingByCategory();
  const month = monthKey();

  const saveBudget = async (catId) => {
    const val = parseFloat(drafts[catId]);
    if (isNaN(val) || val < 0) return;
    setSaving(catId);
    try {
      await upsertBudget(catId, val, `${month}-01`);
      setDrafts((p) => ({ ...p, [catId]: undefined }));
    } finally { setSaving(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Budget</h1>
        <p className="text-sm text-slate-500 mt-1">{currentMonthLabel()}</p>
      </div>

      {/* ── Quick overview bar ───────────────────── */}
      {(() => {
        const totalBudget = data.reduce((s, c) => s + c.budget, 0);
        const totalSpent  = data.reduce((s, c) => s + c.spent, 0);
        const p = pct(totalSpent, totalBudget);
        return totalBudget > 0 ? (
          <div className="card p-5 animate-fade-up">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-xs text-slate-500 font-medium">Overall Budget</p>
                <p className="text-2xl font-bold font-display">{fmt(totalSpent)} <span className="text-sm font-normal text-slate-400">/ {fmt(totalBudget)}</span></p>
              </div>
              <span className={`text-sm font-semibold ${p >= 90 ? 'text-coral-600' : p >= 70 ? 'text-yellow-600' : 'text-mint-600'}`}>{p}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${p >= 90 ? 'bg-coral-400' : p >= 70 ? 'bg-yellow-400' : 'bg-mint-400'}`}
                style={{ width: `${Math.min(p, 100)}%` }} />
            </div>
          </div>
        ) : null;
      })()}

      {/* ── Category budgets ─────────────────────── */}
      <div className="space-y-3">
        {categories.map((cat, idx) => {
          const row = data.find((d) => d.id === cat.id);
          const spent  = row?.spent ?? 0;
          const budget = row?.budget ?? 0;
          const p = pct(spent, budget);
          const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          const draftVal = drafts[cat.id];

          return (
            <div key={cat.id} className="card p-4 animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-semibold flex-1">{cat.name}</span>
                {budget > 0 && (
                  <span className={`text-xs font-semibold ${p >= 90 ? 'text-coral-600' : p >= 70 ? 'text-yellow-600' : 'text-mint-600'}`}>
                    {fmt(spent)} / {fmt(budget)} ({p}%)
                  </span>
                )}
                {budget === 0 && spent > 0 && (
                  <span className="text-xs text-slate-400">Spent {fmt(spent)}</span>
                )}
              </div>

              {/* Progress bar */}
              {budget > 0 && (
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(p, 100)}%`, backgroundColor: p >= 90 ? '#ff7b7b' : p >= 70 ? '#fbbf24' : color }} />
                </div>
              )}

              {/* Alert */}
              {budget > 0 && p >= 90 && (
                <p className="text-xs text-coral-600 bg-coral-100 rounded-lg px-3 py-1.5 mb-3">
                  ⚠️ Over {p >= 100 ? 'budget' : '90% of budget'}!
                </p>
              )}

              {/* Set budget input */}
              <div className="flex gap-2 items-center">
                <input type="number" step="1" min="0" placeholder={budget > 0 ? budget : 'Set limit…'}
                  value={draftVal ?? ''} onChange={(e) => setDrafts((p) => ({ ...p, [cat.id]: e.target.value }))}
                  className="input-field !py-2 text-sm flex-1 max-w-[160px]" />
                <button onClick={() => saveBudget(cat.id)} disabled={saving === cat.id || !draftVal}
                  className="btn-primary !py-2 text-xs">
                  {saving === cat.id ? '…' : 'Set'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
