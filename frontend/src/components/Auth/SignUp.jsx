import React,{useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {Link,useNavigate} from 'react-router-dom';
export default function SignUp(){
  const {signUp}=useAuth(); const nav=useNavigate();
  const [email,setEmail]=useState(''); const [pw,setPw]=useState(''); const [pw2,setPw2]=useState('');
  const [err,setErr]=useState(null); const [busy,setBusy]=useState(false); const [done,setDone]=useState(false);
  const go=async e=>{e.preventDefault();if(pw!==pw2){setErr("Passwords don't match");return;}
    if(pw.length<8){setErr('8+ characters');return;} setBusy(true);setErr(null);
    try{await signUp(email,pw);setDone(true);}catch(e){setErr(e.message);}finally{setBusy(false);}};
  if(done) return(<div className="min-h-screen flex items-center justify-center px-4"><div className="text-center anim"><div className="w-14 h-14 rounded-full bg-mint-100 text-mint-600 flex items-center justify-center text-2xl mx-auto mb-4">✓</div><h2 className="text-lg font-bold">Account created!</h2><p className="text-sm text-slate-500 mt-1">Check email for confirmation, then <Link to="/login" className="text-brand-600 font-semibold">sign in</Link>.</p></div></div>);
  return(
    <div className="min-h-screen flex items-center justify-center px-4 bg-sand-50">
      <div className="w-full max-w-sm card p-7 anim">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        <form onSubmit={go} className="space-y-3">
          {err&&<p className="text-xs text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{err}</p>}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required className="field"/>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password (8+ chars)" required className="field"/>
          <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Confirm password" required className="field"/>
          <button disabled={busy} className="btn-p w-full">{busy?'Creating…':'Create Account'}</button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-5">Have an account? <Link to="/login" className="text-brand-600 font-semibold">Sign in</Link></p>
      </div>
    </div>);
}
