import React, { useState } from 'react';
import { Layout, ArrowRight, Mail, Sparkles, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check configuration immediately
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-rose-100 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-rose-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Configuration Missing</h2>
          <p className="text-slate-600 text-sm mb-6">
            Supabase API keys are not found. Please add <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to your Vercel Project Settings.
          </p>
          <a 
            href="https://vercel.com/dashboard" 
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            Open Vercel Dashboard
          </a>
        </div>
      </div>
    );
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // This enables "Sign Up" automatically
        },
      });

      if (error) throw error;
      setIsOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabase) return;

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;
      // App.tsx listener will handle the redirect/state change
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        <div className="p-8 w-full">
          <div className="flex items-center justify-center gap-3 mb-8">
             <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Layout className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Habit<span className="text-indigo-600">Architect</span>
            </h1>
          </div>

          <h2 className="text-xl font-bold text-center text-slate-800 mb-2">
            {isOtpSent ? 'Check your inbox' : 'Welcome back'}
          </h2>
          <p className="text-center text-slate-500 text-sm mb-8">
            {isOtpSent 
              ? `We sent a temporary login code to ${email}` 
              : 'Enter your email to sign in or create an account.'}
          </p>

          {!isOtpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {error && <div className="text-rose-500 text-xs font-bold text-center bg-rose-50 py-2 rounded-lg">{error}</div>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send Code <ArrowRight size={18} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Login Code</label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 tracking-widest"
                    placeholder="123456"
                  />
                </div>
              </div>

              {error && <div className="text-rose-500 text-xs font-bold text-center bg-rose-50 py-2 rounded-lg">{error}</div>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & Login <CheckCircle2 size={18} /></>}
              </button>

              <button 
                type="button" 
                onClick={() => setIsOtpSent(false)}
                className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 py-2"
              >
                Use a different email
              </button>
            </form>
          )}

          {/* Kairo Teaser */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 opacity-70">
             <div className="bg-indigo-50 p-2 rounded-full">
               <Sparkles size={16} className="text-indigo-500" />
             </div>
             <p className="text-xs text-slate-500 font-medium">
                Powered by <strong>Supabase</strong> Secure Auth
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};