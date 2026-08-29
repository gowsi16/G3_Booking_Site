import React, { useState } from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

const inputCls = "w-full text-sm px-4 py-3 rounded-lg border outline-none bg-slate-50 transition-shadow focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 border-slate-200 text-slate-800";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (form.username && form.password) {
      navigate('/admin/dashboard');
    } else {
      alert("Please enter both username and password.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto pt-10 animate-slide-up">
      <div className="premium-card p-8 sm:p-10 text-center border-t-4 border-t-amber-500">
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-8 bg-amber-50">
          <ShieldCheck size={40} className="text-amber-500" />
        </div>
        
        <h1 style={fontDisplay} className="text-3xl font-bold mb-3 text-slate-800 tracking-tight">Admin Portal</h1>
        <p style={fontBody} className="text-slate-500 mb-8">Secure login to manage bookings and fleet operations.</p>
        
        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div>
            <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Admin Username</label>
            <input 
              type="text" 
              placeholder="admin" 
              className={inputCls} 
              value={form.username} onChange={e => setForm({...form, username: e.target.value})} 
            />
          </div>
          <div>
            <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Master Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className={inputCls} 
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} 
            />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => alert("Master Password reset instructions sent to registered admin email.")} className="text-xs font-semibold text-amber-600 hover:text-amber-700">
              Forgot Master Password?
            </button>
          </div>
          <button
            type="submit"
            style={fontDisplay}
            className="w-full bg-slate-900 text-white hover:bg-slate-800 px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-colors mt-2 shadow-lg shadow-slate-900/20"
          >
            Secure Login <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
