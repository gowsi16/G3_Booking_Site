import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, User, Lock, Phone, Building, FileText, Mail, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

const inputCls = "w-full text-sm px-4 py-3 rounded-lg border outline-none bg-slate-50 transition-all focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 border-slate-200 text-slate-800 font-medium";

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/book';
  const isBookingRedirect = redirectPath.includes('book');

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Login form
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });

  // Register form
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    password: '',
    email: '',
    customer_address: '',
    company: '',
    gst_number: ''
  });
  const [showBusinessFields, setShowBusinessFields] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginForm.phone || !loginForm.password) {
      setError('Please provide both phone number and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      login(data.customer);
      setSuccessMsg('Logged in successfully! Redirecting...');
      setTimeout(() => {
        navigate(redirectPath);
      }, 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regForm.name || !regForm.phone || !regForm.password) {
      setError('Name, phone number, and password are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account');
      }

      login(data.customer);
      setSuccessMsg('Account created successfully! Redirecting to booking...');
      setTimeout(() => {
        navigate(redirectPath);
      }, 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pt-6 pb-12 animate-slide-up">
      {/* Alert if redirected from booking form */}
      {isBookingRedirect && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-sm animate-bounce-short">
          <ShieldCheck className="text-amber-600 mt-0.5 shrink-0" size={20} />
          <div>
            <h4 style={fontDisplay} className="text-sm font-bold text-amber-900">
              Customer Login Required Before Booking
            </h4>
            <p style={fontBody} className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              For security and freight tracking, you must log in to your account before accessing the lorry booking form.
            </p>
          </div>
        </div>
      )}

      <div className="premium-card p-6 sm:p-10 shadow-xl border border-slate-200/80">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 mx-auto shadow-inner">
            <User size={30} />
          </div>
          <h1 style={fontDisplay} className="text-3xl font-bold text-slate-800 tracking-tight">
            {mode === 'login' ? 'Customer Login' : 'Create Customer Account'}
          </h1>
          <p style={fontBody} className="text-slate-500 text-sm mt-1">
            {mode === 'login' 
              ? 'Access your G3 Transport dashboard & book lorries instantly.'
              : 'Register in seconds to book and track shipments.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'login' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            style={fontDisplay}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'register' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            style={fontDisplay}
          >
            Create New Account
          </button>
        </div>

        {/* Error / Success feedback */}
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200 flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span style={fontBody}>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl text-sm bg-green-50 text-green-700 border border-green-200 flex items-center gap-3">
            <CheckCircle2 size={18} className="shrink-0" />
            <span style={fontBody}>{successMsg}</span>
          </div>
        )}

        {/* Form: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" /> Phone Number *
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                className={inputCls}
                value={loginForm.phone}
                onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={14} className="text-slate-400" /> Password *
                </label>
                <button
                  type="button"
                  onClick={() => alert("Please contact G3 Transport support at 9488289991 or gthreetransport@gmail.com to reset your password.")}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className={inputCls}
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={fontDisplay}
              className="w-full btn-primary px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Login to Continue"} <ChevronRight size={18} />
            </button>
          </form>
        )}

        {/* Form: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  className={inputCls}
                  value={regForm.name}
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9488289991"
                  className={inputCls}
                  value={regForm.phone}
                  onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Set Account Password *
              </label>
              <input
                type="password"
                placeholder="Choose a secure password"
                className={inputCls}
                value={regForm.password}
                onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="name@business.com"
                className={inputCls}
                value={regForm.email}
                onChange={e => setRegForm({ ...regForm, email: e.target.value })}
              />
            </div>

            <div>
              <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Customer Residential / Billing Address *
              </label>
              <input
                type="text"
                placeholder="e.g. 3/93, Kalaignar Street, Vellalagundam, Salem"
                className={inputCls}
                value={regForm.customer_address}
                onChange={e => setRegForm({ ...regForm, customer_address: e.target.value })}
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowBusinessFields(!showBusinessFields)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {showBusinessFields ? "- Hide Company & GST details" : "+ Are you registering for a Company / Business? (Optional)"}
              </button>
            </div>

            {showBusinessFields && (
              <div className="grid sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-slide-up">
                <div>
                  <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Salem Textiles Ltd"
                    className={inputCls}
                    value={regForm.company}
                    onChange={e => setRegForm({ ...regForm, company: e.target.value })}
                  />
                </div>
                <div>
                  <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    placeholder="33ABCDE1234F1Z5"
                    className={inputCls}
                    value={regForm.gst_number}
                    onChange={e => setRegForm({ ...regForm, gst_number: e.target.value })}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={fontDisplay}
              className="w-full btn-primary px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Register & Continue Booking"} <ChevronRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
