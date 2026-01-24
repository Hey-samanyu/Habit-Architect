
import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, Layout, AlertCircle, KeyRound, CheckCircle2, User as UserIcon, RotateCcw, ArrowLeft, ShieldCheck } from 'lucide-react';
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

  const handleGoogleSignIn = async () => {
    setError(null);
    if (!isSupabaseConfigured() || !supabase) {
      setError("System connection missing. Please contact support.");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Failed to initialize Google login.");
    }
  };

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
        setError("System connection missing.");
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
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans relative overflow-hidden">
      <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 relative z-10">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl shadow-xl shadow-violet-100 mb-6">
            <Layout className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase">
            Habit<span className="text-violet-600">Architect</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Structural Engineering for Life</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-rose-700 font-bold leading-tight">{error}</p>
          </div>
        )}

        {step === 'email' ? (
          <div className="space-y-6">
            {/* Google Social Login */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative px-4 bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Or use Email</span>
            </div>

            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="flex bg-slate-100 p-1.5 rounded-[1.25rem] border border-slate-200">
                  <button
                      type="button"
                      onClick={() => { setMode('login'); setError(null); }}
                      className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${mode === 'login' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      LOG IN
                  </button>
                  <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(null); }}
                      className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${mode === 'signup' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      SIGN UP
                  </button>
              </div>

              {mode === 'signup' && (
                  <div className="animate-in slide-in-from-top-2">
                      <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Full Name</label>
                      <div className="relative">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                              <UserIcon size={20} />
                          </div>
                          <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-violet-600 outline-none transition-all font-bold text-slate-900"
                              placeholder="Your Name"
                          />
                      </div>
                  </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-violet-600 outline-none transition-all font-bold text-slate-900"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : (
                  <>
                    {mode === 'signup' ? 'ESTABLISH ACCOUNT' : 'SEND ACCESS CODE'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-8 animate-in slide-in-from-right-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-full text-emerald-600 mb-4 border border-emerald-100">
                    <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Verify Architecture</h3>
                <p className="text-slate-500 text-sm mt-1 font-bold">Code sent to {email}</p>
            </div>
            
            <div>
                <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                        <KeyRound size={20} />
                    </div>
                    <input
                        type="text"
                        required
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-violet-600 outline-none transition-all font-mono text-3xl font-black text-slate-900 tracking-[0.5em] text-center"
                        placeholder="••••••"
                        maxLength={6} 
                    />
                </div>
            </div>

            <div className="space-y-4">
                <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <>FINALIZE LOGIN <CheckCircle2 size={20} /></>}
                </button>
                
                <div className="flex items-center justify-between px-2">
                    <button 
                        type="button" 
                        onClick={() => setStep('email')} 
                        className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleSendCode()}
                        disabled={resendTimer > 0 || loading}
                        className="text-violet-600 text-[10px] font-black uppercase tracking-widest hover:text-violet-700 disabled:opacity-40 flex items-center gap-2"
                    >
                       {resendTimer > 0 ? `Retry in ${resendTimer}s` : <><RotateCcw size={14} /> Resend Code</>}
                    </button>
                </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
