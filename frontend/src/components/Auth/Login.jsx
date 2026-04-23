import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await signIn(email, password); nav('/'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="card p-8">
          <h1 className="text-3xl font-bold text-center mb-1 font-display">Budget</h1>
          <p className="text-center text-sm text-slate-500 mb-8">Smart household finance tracker</p>

          <form onSubmit={handle} className="space-y-4">
            {error && <p className="text-sm text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{error}</p>}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input-field" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required className="input-field" />
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            New here?{' '}
            <Link to="/signup" className="text-brand-500 font-semibold hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
