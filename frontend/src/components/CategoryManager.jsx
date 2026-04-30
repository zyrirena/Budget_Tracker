import React,{useState} from 'react';
import {useData} from '../context/DataContext';

const EMPTY={name:'',type:'expense',color:'#3384f5',icon:'📌'};
const ICONS=['📌','🛒','🍽️','💡','🚗','🎬','🛍️','🏥','📱','💵','💰','🏠','🎓','✈️','🐾','👶','💪','🔧'];

export default function CategoryManager(){
  const {categories,addCategory,updateCategory,deleteCategory}=useData();
  const [form,setForm]=useState(EMPTY);
  const [editing,setEditing]=useState(null);
  const [deleting,setDeleting]=useState(null);
  const [reassignTo,setReassignTo]=useState('');
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);

  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  const submit=async e=>{
    e.preventDefault(); setBusy(true); setErr(null);
    try{
      if(editing) await updateCategory(editing,form); else await addCategory(form);
      setForm(EMPTY); setEditing(null);
    }catch(ex){setErr(ex.message);}finally{setBusy(false);}
  };

  const confirmDelete=async()=>{
    if(!deleting) return;
    await deleteCategory(deleting,reassignTo||null);
    setDeleting(null); setReassignTo('');
  };

  const expense=categories.filter(c=>c.type==='expense');
  const income=categories.filter(c=>c.type==='income');

  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Categories</h1>

    <form onSubmit={submit} className="card p-4 space-y-3 anim">
      <h2 className="text-sm font-semibold">{editing?'Edit Category':'New Category'}</h2>
      {err&&<p className="text-xs text-coral-600 bg-coral-100 rounded-lg px-3 py-2">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-[11px] text-slate-500">Name</label><input required value={form.name} onChange={e=>set('name',e.target.value)} className="field"/></div>
        <div><label className="text-[11px] text-slate-500">Type</label><select value={form.type} onChange={e=>set('type',e.target.value)} className="field"><option value="expense">Expense</option><option value="income">Income</option></select></div>
        <div><label className="text-[11px] text-slate-500">Color</label><input type="color" value={form.color} onChange={e=>set('color',e.target.value)} className="field h-10"/></div>
        <div><label className="text-[11px] text-slate-500">Icon</label>
          <div className="flex flex-wrap gap-1 mt-1">{ICONS.map(ic=><button key={ic} type="button" onClick={()=>set('icon',ic)} className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center ${form.icon===ic?'ring-2 ring-brand-400 bg-brand-50':'bg-slate-100 hover:bg-slate-200'}`}>{ic}</button>)}</div>
        </div>
      </div>
      <div className="flex gap-2"><button disabled={busy} className="btn-p flex-1">{busy?'Saving…':editing?'Update':'Create'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(EMPTY);}} className="btn-s">Cancel</button>}</div>
    </form>

    {/* Delete modal */}
    {deleting&&<div className="card p-4 border-2 border-coral-400 space-y-3 anim">
      <p className="text-sm font-semibold text-coral-600">Delete category?</p>
      <p className="text-xs text-slate-600">Existing transactions will be reassigned to:</p>
      <select value={reassignTo} onChange={e=>setReassignTo(e.target.value)} className="field">
        <option value="">— None (leave uncategorized) —</option>
        {categories.filter(c=>c.id!==deleting).map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
      </select>
      <div className="flex gap-2"><button onClick={confirmDelete} className="btn-d flex-1">Delete</button><button onClick={()=>setDeleting(null)} className="btn-s">Cancel</button></div>
    </div>}

    {/* Lists */}
    {[{title:'Expense Categories',list:expense},{title:'Income Categories',list:income}].map(({title,list})=>
      <div key={title}>
        <h3 className="text-sm font-semibold mb-2">{title}</h3>
        {list.length===0?<p className="text-xs text-slate-400">None</p>:
        <div className="space-y-1.5">{list.map(c=><div key={c.id} className="card p-3 flex items-center gap-2">
          <span className="text-lg">{c.icon}</span>
          <span className="w-3 h-3 rounded-full shrink-0" style={{background:c.color}}/>
          <span className="text-sm font-medium flex-1">{c.name}</span>
          <button onClick={()=>{setEditing(c.id);setForm({name:c.name,type:c.type,color:c.color,icon:c.icon});window.scrollTo({top:0,behavior:'smooth'});}} className="text-xs text-brand-500 hover:underline">Edit</button>
          <button onClick={()=>setDeleting(c.id)} className="text-xs text-coral-500 hover:underline">Del</button>
        </div>)}</div>}
      </div>
    )}
  </div>;
}
