import React from 'react';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {AuthProvider,useAuth} from './context/AuthContext';
import {DataProvider} from './context/DataContext';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import Nav from './components/Navigation';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import AccountManager from './components/AccountManager';
import CategoryManager from './components/CategoryManager';
import BudgetPlanner from './components/BudgetPlanner';
import Reports from './components/Reports';
import AIAdvisor from './components/AIAdvisor';

function Guard({children}){
  const {user,loading}=useAuth();
  if(loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-7 h-7 border-2 border-brand-400 border-t-transparent rounded-full"/></div>;
  return user?children:<Navigate to="/login" replace/>;
}
function Shell({children}){
  return <div className="flex h-screen"><Nav/><main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6"><div className="max-w-5xl mx-auto">{children}</div></main></div>;
}

export default function App(){
  return <BrowserRouter><AuthProvider><DataProvider>
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route path="/signup" element={<SignUp/>}/>
      <Route path="/" element={<Guard><Shell><Dashboard/></Shell></Guard>}/>
      <Route path="/transactions" element={<Guard><Shell><Transactions/></Shell></Guard>}/>
      <Route path="/accounts" element={<Guard><Shell><AccountManager/></Shell></Guard>}/>
      <Route path="/categories" element={<Guard><Shell><CategoryManager/></Shell></Guard>}/>
      <Route path="/budget" element={<Guard><Shell><BudgetPlanner/></Shell></Guard>}/>
      <Route path="/reports" element={<Guard><Shell><Reports/></Shell></Guard>}/>
      <Route path="/ai" element={<Guard><Shell><AIAdvisor/></Shell></Guard>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  </DataProvider></AuthProvider></BrowserRouter>;
}
