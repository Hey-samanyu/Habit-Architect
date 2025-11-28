import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Loader2, Layout, AlertCircle, User as UserIcon, Inbox, KeyRound } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured() || !supabase) {
        setError("Supabase connection missing. Please check API keys.");
        setLoading(false);
        return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.user) {
            // Strict Email Verification Check would happen here if enforced by Supabase settings,
            // but usually Supabase allows login if email confirm is off. 
            // If confirm is ON, signInWithPassword fails automatically for unverified users.
            
            onAuthSuccess({
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Architect'
            });
        }
      } else {
        // Sign Up
        if (!name.trim()) throw new Error("Please enter your name");

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        // Check if session exists (means email confirmation is OFF)
        if (data.session) {
             onAuthSuccess({
                id: data.user!.id,
                email: data.user!.email || '',
                name: name
            });
        } else if (data.user) {
            // User created but needs verification
            setIsVerificationSent(true);
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured()) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-rose-50 p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                  <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Configuration Error</h2>
                  <p className="text-slate-600 mb-4">
                      The app cannot connect to Supabase. API keys are missing.
                  </p>
                  <p className="text-slate-500 text-xs mt-4">Add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel.</p>
              </div>
          </div>
      );
  }

  if (isVerificationSent) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative">
            <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl border border-slate-100 text-center relative overflow-hidden">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Inbox size={36} />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Check your Inbox</h2>
                <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                    We've sent a verification link to <span className="font-bold text-indigo-700">{email}</span>.
                </p>
                <button 
                    onClick={() => { setIsVerificationSent(false); setIsLogin(true); }}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                    Back to Sign In
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 mb-4">
            <Layout className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Habit<span className="text-indigo-600">Architect</span></h1>
          <p className="text-slate-500 mt-2">Design your life with Supabase.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-rose-600 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Full Name</label>
                <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon size={20} />
                </div>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-medium text-slate-800"
                    placeholder="John Doe"
                />
                </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-medium text-slate-800"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-medium text-slate-800"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1.5 text-indigo-600 font-bold hover:underline focus:outline-none"
                >
                {isLogin ? "Sign Up" : "Sign In"}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};