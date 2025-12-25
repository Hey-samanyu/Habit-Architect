
import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, Layout, AlertCircle, Inbox, KeyRound, CheckCircle2, User as UserIcon, RefreshCw, ArrowLeft, RotateCcw, ShieldCheck } from 'lucide-react';
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
  const [resendTimer, setResendTimer] = useState(0);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
          shouldCreateUser: mode === 'signup',
          data: mode === 'signup' ? { full_name: name } : undefined,
        },
      });

      if (error) throw error;
      
      setStep('otp'); 
      setResendTimer(30);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) clearInterval(timer);
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "Failed to send code. Please try again.";
      setError(msg);
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
      
      // Smart Verification: Try both common OTP types
      const types = ['signup', 'magiclink', 'email'] as const;
      let success = false;

      for (const type of types) {
          const result = await supabase.auth.verifyOtp({
              email,
              token: otp,
              type: type as any,
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
      setError("Invalid code or session expired. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-400 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 blur-[120px] rounded-full"></div>
      </div>
      
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl shadow-xl shadow-violet-200 dark:shadow-none mb-6">
            <Layout className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Habit<span className="text-violet-600 dark:text-violet-400">Architect</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Design your habits, build your life.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-rose-600 dark:text-rose-400 font-bold leading-tight">{error}</p>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[1.25rem] mb-6 border border-slate-200/50 dark:border-slate-700/50">
                <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Log In
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === 'signup' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Sign Up
                </button>
            </div>

            {mode === 'signup' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 ml-1 uppercase tracking-wider">Display Name</label>
                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
                            <UserIcon size={20} />
                        </div>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900/20 outline-none transition-all font-semibold text-slate-800 dark:text-white"
                            placeholder="Alex Architect"
                        />
                    </div>
                </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900/20 outline-none transition-all font-semibold text-slate-800 dark:text-white"
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {mode === 'signup' ? 'Create Account' : 'Send Access Code'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-slate-400 font-medium">
                We'll email you a secure login code. No password needed.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-100 dark:border-emerald-800">
                    <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verify Identity</h3>
                <p className="text-slate-500 text-sm mt-1">We sent a code to <span className="text-violet-600 font-bold">{email}</span></p>
            </div>
            
            <div>
                <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
                        <KeyRound size={20} />
                    </div>
                    <input
                        type="text"
                        required
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900/20 outline-none transition-all font-mono text-3xl font-extrabold text-slate-800 dark:text-white tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-300 text-center"
                        placeholder="••••••"
                        maxLength={6} 
                    />
                </div>
                <p className="text-center text-xs text-slate-400 mt-4 font-medium italic">Check your inbox (and spam) for a 6-digit code.</p>
            </div>

            <div className="space-y-4">
                <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <>Continue to Architect <CheckCircle2 size={20} /></>}
                </button>
                
                <div className="flex items-center justify-between px-2">
                    <button 
                        type="button" 
                        onClick={() => setStep('email')} 
                        className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={16} /> Edit Email
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleSendCode()}
                        disabled={resendTimer > 0 || loading}
                        className="text-violet-600 dark:text-violet-400 text-sm font-bold hover:text-violet-700 transition-colors disabled:opacity-40 flex items-center gap-2"
                    >
                       {resendTimer > 0 ? `Resend in ${resendTimer}s` : <><RotateCcw size={16} /> Resend Code</>}
                    </button>
                </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
