
import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, Layout, AlertCircle, KeyRound, CheckCircle2, User as UserIcon, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const TEST_ACCOUNT_ID = '77777777-7777-7777-7777-777777777777';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTestAccount = email.toLowerCase().trim() === 'test@test.com';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Test Mode bypass
    if (isTestAccount) {
        setTimeout(() => {
            onAuthSuccess({
                id: TEST_ACCOUNT_ID,
                email: 'test@test.com',
                name: 'Test Architect'
            });
            setLoading(false);
        }, 600);
        return;
    }

    if (!isSupabaseConfigured() || !supabase) {
        setError("Database connection missing. Please configure Supabase.");
        setLoading(false);
        return;
    }

    try {
      if (mode === 'signup') {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });
        if (signupError) throw signupError;
        
        if (data?.user) {
            onAuthSuccess({
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.full_name || name || 'Architect'
            });
        }
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;

        if (data?.user) {
            onAuthSuccess({
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.full_name || 'Architect'
            });
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message === "Invalid login credentials") {
          setError("Incorrect email or password. Please try again.");
      } else if (err.message.includes("rate limit")) {
          setError("Too many attempts. Please wait a moment and try again.");
      } else {
          setError(err.message || "Authentication failed.");
      }
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
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Professional System Tracking</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-bold flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 mb-8">
            <button 
                type="button" 
                onClick={() => { setMode('login'); setError(null); }} 
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${mode === 'login' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                LOG IN
            </button>
            <button 
                type="button" 
                onClick={() => { setMode('signup'); setError(null); }} 
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${mode === 'signup' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                SIGN UP
            </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
            {mode === 'signup' && (
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <div className="relative">
                        <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            required 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-50 font-bold transition-all" 
                            placeholder="Alex Architect" 
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-50 font-bold transition-all" 
                        placeholder="email@example.com" 
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Password</label>
                <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-50 font-bold transition-all" 
                        placeholder="••••••••" 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
            >
                {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                        {mode === 'signup' ? 'ESTABLISH ACCOUNT' : 'SECURE ACCESS'} 
                        <ArrowRight size={20} />
                    </>
                )}
            </button>

            {isTestAccount && (
                <div className="mt-6 p-4 bg-violet-50 border border-violet-100 rounded-2xl text-center">
                    <p className="text-violet-600 font-black text-[10px] uppercase tracking-widest animate-pulse">Test Architect Entry</p>
                    <p className="text-violet-500 font-bold text-[9px] mt-1">Use any password to enter the demo vault</p>
                </div>
            )}
        </form>
        
        <p className="text-center mt-8 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
            Behavioral Integrity Protocol Enabled
        </p>
      </div>
    </div>
  );
};
