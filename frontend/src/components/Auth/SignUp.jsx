import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function SignUp() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [email, setEmail]     = useState('');
  const [pw, setPw]           = useState('');
  const [pw2, setPw2]         = useState('');
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState(false);
  const [done, setDone]       = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (pw !== pw2)        { setError('Passwords don\u2019t match'); return; }
    if (pw.length < 8)     { setError('Password must be 8+ characters'); return; }
    setBusy(true); setError(null);
    try { await signUp(email, pw); setDone(true); setTimeout(() => nav('/login'), 2500); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4">
      <div className="text-center animate-fade-up">
        <div className="w-14 h-14 rounded-full bg-mint-100 text-mint-600 flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
        <h2 className="text-xl font-bold mb-1">Account created!</h2>
        <p className="text-sm text-slate-500">Check your email for a confirmation link, then sign in.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="card p-8">
          <h1 className="text-3xl font-bold text-center mb-1 font-display">Create Account</h1>
          <p className="text-center text-sm text-slate-500 mb-8">Start tracking your finances</p>

          <form onSubmit={handle} className="space-y-4">
            {error && <p className="text-sm text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{error}</p>}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                placeholder="Min. 8 characters" required className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm Password</label>
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
                placeholder="••••••••" required className="input-field" />
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
              {busy ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
