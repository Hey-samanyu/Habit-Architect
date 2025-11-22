import React, { useState, useEffect } from 'react';
import { Layout, ArrowRight, Mail, Lock, AlertCircle, ServerCrash, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
      setIsConfigured(isSupabaseConfigured());
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!isConfigured) {
        setError("Missing API Keys. Please configure Vercel Environment Variables.");
        setLoading(false);
        return;
    }

    try {
      if (isSignUp) {
        // --- SIGN UP ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          setMessage("Account created! Please check your email to confirm your account before logging in.");
          setIsSignUp(false); // Switch back to login view
        } else if (data.session) {
          // User is signed up and logged in immediately (if email confirm is off)
          onLoginSuccess();
        }

      } else {
        // --- SIGN IN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        <div className="p-8 w-full">
          <div className="flex items-center justify-center gap-3 mb-6">
             <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Layout className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Habit<span className="text-indigo-600">Architect</span>
            </h1>
          </div>

          {!isConfigured && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <ServerCrash className="text-amber-600 flex-shrink-0" size={20} />
                  <div>
                      <h3 className="text-sm font-bold text-amber-800">Setup Required</h3>
                      <p className="text-xs text-amber-700 mt-1">
                          The database is not connected. Please add <strong>SUPABASE_URL</strong> and <strong>SUPABASE_ANON_KEY</strong> to your Vercel Environment Variables and redeploy.
                      </p>
                  </div>
              </div>
          )}

          <h2 className="text-xl font-bold text-center text-slate-800 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-center text-slate-500 text-sm mb-8">
            {isSignUp ? 'Start tracking your habits today.' : 'Sign in to continue your progress.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {isSignUp && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <Layout size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email</label>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold bg-rose-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            {message && (
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-2 text-center">
                 <ShieldCheck size={16} />
                {message}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 disabled:bg-slate-400 disabled:shadow-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setMessage('');
              }}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};