
import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, Layout, AlertCircle, KeyRound, CheckCircle2, User as UserIcon, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

// Updated to the requested UID for Samanyu Kots
export const TEST_ACCOUNT_ID = 'c04c01c0-bd0d-46b2-a30a-b5dc93974259';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTestAccount = email.toLowerCase().trim() === 'test@test.com' || email.toLowerCase().trim() === 'samanyukots4@gmail.com';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Test Mode bypass
    if (isTestAccount) {
        setTimeout(() => {
            onAuthSuccess({
                id: TEST_ACCOUNT_ID,
                email: 'samanyukots4@gmail.com',
                name: 'Samanyu Kots'
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl shadow-xl mb-6">
            <Layout className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Habit<span className="text-violet-600">Architect</span></h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Professional System Tracking</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-bold flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 mb-8">
            <button 
                type="button" 
                onClick={() => { setMode('login'); setError(null); }} 
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                LOG IN
            </button>
            <button 
                type="button" 
                onClick={() => { setMode('signup'); setError(null); }} 
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${mode === 'signup' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                SIGN UP
            </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
            {mode === 'signup' && (
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Full Name</label>
                    <div className="relative">
                        <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                        <input 
                            type="text" 
                            required 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-50 dark:focus:ring-violet-900/20 font-bold transition-all text-slate-900 dark:text-white" 
                            placeholder="Alex Architect" 
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-50 dark:focus:ring-violet-900/20 font-bold transition-all text-slate-900 dark:text-white" 
                        placeholder="email@example.com" 
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Secure Password</label>
                <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full pl-14 pr-14 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-50 dark:focus:ring-violet-900/20 font-bold transition-all text-slate-900 dark:text-white" 
                        placeholder="••••••••" 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
            >
                {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                        {mode === 'signup' ? 'ESTABLISH ACCOUNT' : 'SECURE ACCESS'} 
                        <ArrowRight size={20} />
                    </>
                )}
            </button>

            {isTestAccount && (
                <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-2xl text-center">
                    <p className="text-violet-600 dark:text-violet-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Architect Entry Authorized</p>
                    <p className="text-violet-500 dark:text-violet-500 font-bold text-[9px] mt-1">Confirmed for Samanyu Kots</p>
                </div>
            )}
        </form>
        
        <p className="text-center mt-8 text-slate-400 dark:text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em]">
            Behavioral Integrity Protocol Enabled
        </p>
      </div>
    </div>
  );
};
