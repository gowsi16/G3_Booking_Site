import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, User } from 'lucide-react';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

const inputCls = "w-full text-sm px-4 py-3 rounded-lg border outline-none bg-slate-50 transition-shadow focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 text-slate-800";

export default function Login() {
  const [form, setForm] = useState({ phone: '', password: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    alert("Customer login flow will be integrated here.");
  };

  return (
    <div className="w-full max-w-md mx-auto pt-10 animate-slide-up">
      <div className="premium-card p-8 sm:p-10">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-8 mx-auto">
          <User size={32} />
        </div>
        <h1 style={fontDisplay} className="text-3xl font-bold mb-3 text-slate-800 text-center">Welcome Back</h1>
        <p style={fontBody} className="text-slate-500 text-center mb-8">Login to manage your bookings and track shipments.</p>
        
        <form onSubmit={handleLogin} className="space-y-5 mb-8">
          <div>
            <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
            <input 
              type="text" 
              placeholder="e.g. 9876543210" 
              className={inputCls} 
              value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} 
            />
          </div>
          <div>
            <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className={inputCls} 
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} 
            />
          </div>
          <div className="flex justify-end mt-1">
            <button type="button" onClick={() => alert("Password reset link sent to your registered phone/email.")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Forgot Password?
            </button>
          </div>
          <button
            type="submit"
            style={fontDisplay}
            className="w-full btn-primary px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 mt-2"
          >
            Login <ChevronRight size={18} />
          </button>
        </form>
        
        <p style={fontBody} className="text-sm text-center text-slate-500 border-t border-slate-100 pt-6">
          Don't have an account? <br/>
          <Link to="/book" className="font-bold text-blue-600 hover:text-blue-700 mt-1 inline-block">Book a Lorry to create one</Link>
        </p>
      </div>
    </div>
  );
}
