import React,{createContext,useContext,useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

const Ctx = createContext(null);

export function AuthProvider({children}){
  const [user,setUser]     = useState(null);
  const [hhId,setHhId]     = useState(null);   // active household id
  const [loading,setLoading] = useState(true);

  /* resolve household for user */
  const resolveHH = async (uid)=>{
    const {data} = await supabase.from('household_members').select('household_id').eq('user_id',uid).limit(1).single();
    if(data){ setHhId(data.household_id); return; }
    // first login → create household
    const {data:hh} = await supabase.from('households').insert({name:'My Household'}).select().single();
    if(!hh) return;
    await supabase.from('household_members').insert({household_id:hh.id,user_id:uid,role:'owner',display_name:'Me'});
    setHhId(hh.id);
  };

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      const u=session?.user??null; setUser(u);
      if(u) resolveHH(u.id).finally(()=>setLoading(false));
      else setLoading(false);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      const u=session?.user??null; setUser(u);
      if(u) resolveHH(u.id).finally(()=>setLoading(false));
      else { setHhId(null); setLoading(false); }
    });
    return ()=>subscription?.unsubscribe();
  },[]);

  const signUp = async(email,password,name)=>{
    const {data,error}=await supabase.auth.signUp({email,password});
    if(error) throw error;
    // display_name will be set during resolveHH or later
    return data.user;
  };
  const signIn = async(email,password)=>{
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error) throw error;
    return data.user;
  };
  const signOut = ()=>supabase.auth.signOut();

  return <Ctx.Provider value={{user,hhId,loading,signUp,signIn,signOut}}>{children}</Ctx.Provider>;
}
export const useAuth=()=>{ const c=useContext(Ctx); if(!c) throw new Error('useAuth outside provider'); return c; };
