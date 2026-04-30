import React,{useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {Link,useNavigate} from 'react-router-dom';
export default function Login(){
  const {signIn}=useAuth(); const nav=useNavigate();
  const [email,setEmail]=useState(''); const [pw,setPw]=useState('');
  const [err,setErr]=useState(null); const [busy,setBusy]=useState(false);
  const go=async e=>{e.preventDefault();setBusy(true);setErr(null);
    try{await signIn(email,pw);nav('/');}catch(e){setErr(e.message);}finally{setBusy(false);}};
  return(
    <div className="min-h-screen flex items-center justify-center px-4 bg-sand-50">
      <div className="w-full max-w-sm card p-7 anim">
        <h1 className="text-2xl font-bold text-center mb-1">💰 Budget</h1>
        <p className="text-center text-xs text-slate-500 mb-6">Smart household finance tracker</p>
        <form onSubmit={go} className="space-y-3">
          {err&&<p className="text-xs text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{err}</p>}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required className="field"/>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password" required className="field"/>
          <button disabled={busy} className="btn-p w-full">{busy?'Signing in…':'Sign In'}</button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-5">New? <Link to="/signup" className="text-brand-600 font-semibold">Create account</Link></p>
      </div>
    </div>);
}
