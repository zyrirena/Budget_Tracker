import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { monthKey } from '../utils/helpers';

const Ctx = createContext(null);

export function BudgetProvider({ children }) {
  const { user } = useAuth();

  const [expenses,   setExpenses]   = useState([]);
  const [accounts,   setAccounts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets,    setBudgets]    = useState([]);
  const [loading,    setLoading]    = useState(false);

  /* ── Fetchers ─────────────────────────────────────── */
  const fetchExpenses = useCallback(async () => {
    const { data } = await supabase
      .from('expenses').select('*')
      .order('expense_date', { ascending: false });
    setExpenses(data ?? []);
  }, []);

  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase
      .from('accounts').select('*')
      .eq('is_active', true)
      .order('created_at');
    setAccounts(data ?? []);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories').select('*').order('name');
    setCategories(data ?? []);
  }, []);

  const fetchBudgets = useCallback(async () => {
    const { data } = await supabase
      .from('budgets').select('*')
      .order('month', { ascending: false });
    setBudgets(data ?? []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchExpenses(), fetchAccounts(), fetchCategories(), fetchBudgets()]);
    setLoading(false);
  }, [fetchExpenses, fetchAccounts, fetchCategories, fetchBudgets]);

  useEffect(() => { if (user) refresh(); }, [user, refresh]);

  /* ── Seed default categories on first sign-up ────── */
  const seedCategories = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from('categories').select('id', { count: 'exact', head: true });
    if (count > 0) return;
    const defaults = [
      { name: 'Groceries',      color: '#5cc9a7', icon: '🛒' },
      { name: 'Utilities',      color: '#ff7b7b', icon: '💡' },
      { name: 'Transportation', color: '#3a9fff', icon: '🚗' },
      { name: 'Entertainment',  color: '#ffb347', icon: '🎬' },
      { name: 'Dining Out',     color: '#a78bfa', icon: '🍽️' },
      { name: 'Shopping',       color: '#f472b6', icon: '🛍️' },
      { name: 'Healthcare',     color: '#34d399', icon: '🏥' },
      { name: 'Subscriptions',  color: '#fbbf24', icon: '📱' },
      { name: 'Other',          color: '#94a3b8', icon: '📌' },
    ];
    await supabase.from('categories').insert(
      defaults.map((c) => ({ ...c, user_id: user.id, is_system: true })),
    );
    await fetchCategories();
  }, [user, fetchCategories]);

  useEffect(() => { seedCategories(); }, [seedCategories]);

  /* ── Mutations ────────────────────────────────────── */
  const addExpense = async (row) => {
    const { error } = await supabase.from('expenses').insert({
      ...row, user_id: user.id, paid_by: user.id,
    });
    if (error) throw error;
    await fetchExpenses();
  };

  const updateExpense = async (id, row) => {
    const { error } = await supabase.from('expenses').update(row).eq('id', id);
    if (error) throw error;
    await fetchExpenses();
  };

  const deleteExpense = async (id) => {
    await supabase.from('expenses').delete().eq('id', id);
    await fetchExpenses();
  };

  const addAccount = async (row) => {
    const { error } = await supabase.from('accounts').insert({ ...row, user_id: user.id });
    if (error) throw error;
    await fetchAccounts();
  };

  const updateAccount = async (id, row) => {
    await supabase.from('accounts').update(row).eq('id', id);
    await fetchAccounts();
  };

  const deleteAccount = async (id) => {
    await supabase.from('accounts').update({ is_active: false }).eq('id', id);
    await fetchAccounts();
  };

  const upsertBudget = async (category_id, limit_amount, month) => {
    const { error } = await supabase.from('budgets').upsert(
      { category_id, limit_amount, month, user_id: user.id },
      { onConflict: 'user_id,category_id,month' },
    );
    if (error) throw error;
    await fetchBudgets();
  };

  /* ── Derived ──────────────────────────────────────── */
  const totals = () => {
    const sum = (type) => accounts.filter((a) => a.account_type === type).reduce((s, a) => s + Number(a.balance), 0);
    const mk = monthKey();
    const monthlySpending = expenses
      .filter((e) => e.expense_date.slice(0, 7) === mk)
      .reduce((s, e) => s + Number(e.amount), 0);
    return { checking: sum('checking'), savings: sum('savings'), debt: sum('credit_card') + sum('loan'), monthlySpending };
  };

  const spendingByCategory = (month = monthKey()) => {
    const map = {};
    expenses.filter((e) => e.expense_date.slice(0, 7) === month).forEach((e) => {
      map[e.category_id] = (map[e.category_id] ?? 0) + Number(e.amount);
    });
    return categories.map((c) => ({
      id: c.id, name: c.name, color: c.color,
      spent: map[c.id] ?? 0,
      budget: budgets.find((b) => b.category_id === c.id && b.month.slice(0, 7) === month)?.limit_amount ?? 0,
    })).filter((c) => c.spent > 0 || c.budget > 0);
  };

  return (
    <Ctx.Provider value={{
      expenses, accounts, categories, budgets, loading,
      refresh, addExpense, updateExpense, deleteExpense,
      addAccount, updateAccount, deleteAccount, upsertBudget,
      totals, spendingByCategory,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useBudget = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBudget must be inside <BudgetProvider>');
  return ctx;
};
