import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BudgetProvider } from './context/BudgetContext';

import Login          from './components/Auth/Login';
import SignUp         from './components/Auth/SignUp';
import Navigation     from './components/Navigation';
import Dashboard      from './components/Dashboard';
import Expenses       from './components/Expenses';
import AccountManager from './components/AccountManager';
import BudgetPlanner  from './components/BudgetPlanner';
import Reports        from './components/Reports';
import AIAdvisor      from './components/AIAdvisor';

/* ── Route guard ────────────────────────────────────── */
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

/* ── Shell layout (nav + scrollable main) ───────────── */
function Shell({ children }) {
  return (
    <div className="flex h-screen">
      <Navigation />
      <main className="flex-1 overflow-y-auto p-5 md:p-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

/* ── App ────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BudgetProvider>
          <Routes>
            {/* Public */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected */}
            <Route path="/"         element={<Protected><Shell><Dashboard /></Shell></Protected>} />
            <Route path="/expenses" element={<Protected><Shell><Expenses /></Shell></Protected>} />
            <Route path="/accounts" element={<Protected><Shell><AccountManager /></Shell></Protected>} />
            <Route path="/budget"   element={<Protected><Shell><BudgetPlanner /></Shell></Protected>} />
            <Route path="/reports"  element={<Protected><Shell><Reports /></Shell></Protected>} />
            <Route path="/ai"       element={<Protected><Shell><AIAdvisor /></Shell></Protected>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BudgetProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
