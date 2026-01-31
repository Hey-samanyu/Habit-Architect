
import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, Layout, AlertCircle, KeyRound, CheckCircle2, User as UserIcon, RotateCcw, ArrowLeft, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

// Fixed ID for the test account so it always finds the same data in your Supabase
export const TEST_ACCOUNT_ID = '77777777-7777-7777-7777-777777777777';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const isTestAccount = email.toLowerCase().trim() === 'test@test.com';

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    // BYPASS: If they use the test email, don't ask Supabase to send an email.
    if (isTestAccount) {
        setTimeout(() => {
            setStep('otp');
            setLoading(false);
        }, 300);
        return;
    }

    if (!isSupabaseConfigured() || !supabase) {
        setError("Database not connected.");
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
    } catch (err: any) {
      setError(err.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // BYPASS: If test email, let them in instantly with any code.
    if (isTestAccount) {
        onAuthSuccess({
            id: TEST_ACCOUNT_ID,
            email: 'test@test.com',
            name: 'Test Architect'
        });
        setLoading(false);
        return;
    }

    if (!supabase) return;

    try {
      // Normal users must verify with the real code from their email.
      const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'otp', // or try 'signup'/'magiclink' based on mode
      });

      if (error) throw error;

      if (data?.user) {
        onAuthSuccess({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || name || 'Architect'
        });
      }
    } catch (err: any) {
      setError("Invalid code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-slate-200">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl shadow-xl mb-6">
            <Layout className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase">Habit<span className="text-violet-600">Architect</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Elite System Tracking</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-bold flex items-center gap-3">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button type="button" onClick={() => setMode('login')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'login' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500'}`}>LOG IN</button>
                <button type="button" onClick={() => setMode('signup')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'signup' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500'}`}>SIGN UP</button>
            </div>
            {mode === 'signup' && (
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-violet-600 font-bold" placeholder="Your Name" />
            )}
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-violet-600 font-bold" placeholder="email@example.com" />
            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <>{mode === 'signup' ? 'CREATE ACCOUNT' : 'LOG IN'} <ArrowRight size={20} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center mb-4">
                <p className="text-slate-500 font-bold text-sm">Enter the code sent to {email}</p>
                {isTestAccount && <p className="text-violet-600 font-black text-xs uppercase mt-1">Test Mode: Enter any 6 numbers</p>}
            </div>
            <input type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))} className="w-full py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-violet-600 font-black text-3xl tracking-[0.5em] text-center" placeholder="000000" />
            <button type="submit" disabled={loading} className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black shadow-xl hover:bg-violet-700 transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'VERIFY & ENTER'}
            </button>
            <button type="button" onClick={() => setStep('email')} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"><ArrowLeft size={14} /> Back to email</button>
          </form>
        )}
      </div>
    </div>
  );
};
