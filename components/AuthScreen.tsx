import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, Layout, AlertCircle, Inbox, KeyRound, CheckCircle2, User as UserIcon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
        setError("Supabase connection missing. Please check API keys.");
        setLoading(false);
        return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === 'signup', // Only allow creation in signup mode? Or allow flexible.
          // Pass name metadata if signing up
          data: mode === 'signup' ? { full_name: name } : undefined,
        },
      });

      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabase) return;

    try {
      let data, error;
      
      // Smart Verification: Try token types based on likelihood
      // If in 'signup' mode, prioritize 'signup' token type.
      // If in 'login' mode, prioritize 'magiclink'.
      const primaryType = mode === 'signup' ? 'signup' : 'magiclink';
      const secondaryType = mode === 'signup' ? 'magiclink' : 'signup';
      
      const tokenTypes = [primaryType, secondaryType, 'recovery', 'email'] as const;
      let success = false;

      for (const type of tokenTypes) {
          const result = await supabase.auth.verifyOtp({
              email,
              token: otp,
              type: type,
          });

          if (!result.error && result.data?.user) {
              data = result.data;
              success = true;
              break; 
          }
          if (result.error) error = result.error;
      }

      if (!success && error) throw error;

      if (data?.user) {
        onAuthSuccess({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || name || email.split('@')[0] || 'Architect'
        });
      }
    } catch (err: any) {
      console.error("Verification Error:", err);
      setError("Invalid code or expired. Please check your email again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured()) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-rose-50 p-4 font-sans">
              <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md border border-rose-100">
                  <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                     <AlertCircle size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Configuration Error</h2>
                  <p className="text-slate-600 mb-6">
                      The app cannot connect to Supabase. API keys are missing.
                  </p>
                  <p className="text-slate-500 text-xs bg-slate-100 p-3 rounded-lg font-mono">Add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel Settings.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-indigo-600 skew-y-3 origin-top-left -translate-y-20 z-0"></div>
      
      <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100 relative z-10 animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-5">
            <Layout className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Habit<span className="text-indigo-600">Architect</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Design your habits, build your life.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-rose-600 font-bold">{error}</p>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-5">
            
            {/* Header / Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Log In
                </button>
                <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Sign Up
                </button>
            </div>

            {mode === 'signup' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Your Name</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <UserIcon size={20} />
                        </div>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-800"
                            placeholder="Alex Smith"
                        />
                    </div>
                </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-800"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {mode === 'signup' ? 'Create Account' : 'Get Login Code'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">
                We'll email you a secure code to {mode === 'signup' ? 'verify your account' : 'log in'}.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                    <Inbox size={20} />
                </div>
                <div>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Code Sent To</p>
                    <p className="text-sm font-bold text-indigo-900">{email}</p>
                </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Enter Code</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <KeyRound size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-mono text-xl font-bold text-slate-800 tracking-widest placeholder:tracking-normal"
                  placeholder="123456"
                  maxLength={10} 
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Verify & Enter
                  <CheckCircle2 size={20} />
                </>
              )}
            </button>
            
            <button 
                type="button" 
                onClick={() => setStep('email')} 
                className="w-full text-slate-500 text-sm font-semibold hover:text-indigo-600 transition-colors"
            >
                Start Over
            </button>
          </form>
        )}
      </div>
    </div>
  );
};