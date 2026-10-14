import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ChevronRight, 
  Mail, 
  KeyRound, 
  RefreshCw, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Lock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

const inputCls = "w-full text-sm px-4 py-3 rounded-lg border outline-none bg-slate-50 transition-shadow focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 border-slate-200 text-slate-800 font-medium";

export default function AdminLogin() {
  const navigate = useNavigate();

  // Step 1: 'CREDENTIALS' | Step 2: 'OTP'
  const [step, setStep] = useState('CREDENTIALS');

  // Form states
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  // Session & Metadata from Step 1
  const [sessionToken, setSessionToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // Timers
  const [expirySeconds, setExpirySeconds] = useState(300); // 5 minutes
  const [cooldownSeconds, setCooldownSeconds] = useState(60); // 60s cooldown

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);

  // If already logged in with valid token, redirect to dashboard
  useEffect(() => {
    const existingToken = sessionStorage.getItem('g3_admin_token');
    if (existingToken) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  // Expiry countdown timer (5 minutes)
  useEffect(() => {
    if (step !== 'OTP' || expirySeconds <= 0) return;
    const interval = setInterval(() => {
      setExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, expirySeconds]);

  // Resend cooldown timer (60s)
  useEffect(() => {
    if (step !== 'OTP' || cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, cooldownSeconds]);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Step 1: Submit Credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password) {
      setError('Please enter both admin username and master password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      setSessionToken(data.sessionToken);
      setMaskedEmail(data.maskedEmail || 'registered admin email');
      setExpirySeconds(data.expiresInSeconds || 300);
      setCooldownSeconds(data.resendCooldownSeconds || 60);
      setRemainingAttempts(5);
      setOtp(['', '', '', '', '', '']);
      setSuccess(data.message || `Verification code sent to ${data.maskedEmail || 'your email'}.`);
      setStep('OTP');
      
      // Auto-focus first OTP input after small delay
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP inputs handling
  const handleOtpChange = (index, value) => {
    // Only accept numeric
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Single digit entry
    const newOtp = [...otp];
    newOtp[index] = cleanVal.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (index < 5 && cleanVal) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('This OTP has expired. Please click Resend Code to receive a new one.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          otp: fullOtp
        })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        throw new Error(data.error || 'Failed to verify OTP.');
      }

      // Store JWT token and admin details in sessionStorage
      sessionStorage.setItem('g3_admin_token', data.token);
      sessionStorage.setItem('g3_admin_user', JSON.stringify(data.admin));

      setSuccess('Identity verified! Redirecting to Dispatch Operations...');
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || loading) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/admin/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not resend OTP.');
      }

      setExpirySeconds(300);
      setCooldownSeconds(data.resendCooldownSeconds || 60);
      setRemainingAttempts(5);
      setOtp(['', '', '', '', '', '']);
      setSuccess(data.message || 'A fresh 6-digit OTP code has been sent to your email.');
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto pt-8 pb-16 animate-slide-up">
      <div className="premium-card p-8 sm:p-10 text-center border-t-4 border-t-amber-500 shadow-xl">
        
        {/* Shield Icon Header */}
        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 bg-gradient-to-tr from-amber-500/10 to-amber-500/20 text-amber-600 border border-amber-200/50 shadow-inner">
          {step === 'CREDENTIALS' ? (
            <ShieldCheck size={42} className="text-amber-500" />
          ) : (
            <KeyRound size={38} className="text-amber-500 animate-bounce" />
          )}
        </div>
        
        <h1 style={fontDisplay} className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-800 tracking-tight">
          {step === 'CREDENTIALS' ? 'Admin Dispatch Portal' : 'Two-Factor Verification'}
        </h1>
        <p style={fontBody} className="text-slate-500 text-sm mb-6 leading-relaxed">
          {step === 'CREDENTIALS' 
            ? 'Authorized personnel only. Password verification requires secondary email OTP authorization.' 
            : `Enter the 6-digit one-time code sent to ${maskedEmail || 'your registered Gmail'}.`}
        </p>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl text-xs bg-red-50 text-red-700 border border-red-200 flex items-start gap-2.5 text-left animate-slide-up">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Global Success Notice */}
        {success && (
          <div className="mb-5 p-3.5 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-start gap-2.5 text-left animate-slide-up">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            <div className="flex-1 font-medium leading-relaxed">{success}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: CREDENTIALS                                                       */}
        {/* ========================================================================= */}
        {step === 'CREDENTIALS' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-left">
            <div>
              <label style={fontBody} className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Admin Username
              </label>
              <input 
                type="text" 
                placeholder="admin" 
                className={inputCls} 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required
                autoFocus
              />
            </div>
            
            <div>
              <label style={fontBody} className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Master Password
              </label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className={inputCls} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                style={fontDisplay}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400 px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/10 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to OTP Verification</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 font-medium">
                <Lock size={12} /> Encrypted with SHA-256 and Google Gmail SMTP 2FA
              </span>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: 6-DIGIT OTP VERIFICATION                                          */}
        {/* ========================================================================= */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 text-left">
            
            {/* OTP Input Boxes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label style={fontBody} className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  6-Digit One-Time Code
                </label>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <Clock size={13} className={expirySeconds < 60 ? "text-red-500 animate-pulse" : "text-amber-600"} />
                  <span className={expirySeconds < 60 ? "text-red-600 font-bold" : "text-slate-700"}>
                    {formatTime(expirySeconds)}
                  </span>
                </div>
              </div>

              {/* 6 Digit Inputs */}
              <div className="flex items-center justify-between gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border border-slate-300 bg-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 transition-all shadow-2xs font-mono"
                  />
                ))}
              </div>

              {/* Attempts counter if any error happened */}
              {remainingAttempts !== null && remainingAttempts < 5 && (
                <div className="mt-2 text-right">
                  <span className="text-[11px] font-semibold text-amber-700">
                    {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining
                  </span>
                </div>
              )}
            </div>


            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={loading || expirySeconds <= 0}
                style={fontDisplay}
                className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:bg-slate-300 disabled:text-slate-500 px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Access Dashboard</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('CREDENTIALS');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldownSeconds > 0 || loading}
                  className={`font-semibold flex items-center gap-1 transition-colors ${
                    cooldownSeconds > 0 
                      ? 'text-slate-400 cursor-not-allowed' 
                      : 'text-amber-600 hover:text-amber-700 cursor-pointer'
                  }`}
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  {cooldownSeconds > 0 ? `Resend code (${cooldownSeconds}s)` : 'Resend Code'}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
