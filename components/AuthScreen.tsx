import React, { useState, useEffect } from 'react';
import { Layout, ArrowRight, Mail, Sparkles, AlertCircle, ServerCrash, ShieldCheck, KeyRound } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
      setIsConfigured(isSupabaseConfigured());
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });
      
      if (error) throw error;
      
      setMessage(`Code sent to ${email}`);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Error sending code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;
      // onAuthStateChange in App.tsx will pick this up
    } catch (err: any) {
      setError(err.message || 'Invalid code');
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
          <div className="flex items-center justify-center gap-3 mb-8">
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
            {step === 'email' ? 'Welcome' : 'Check your inbox'}
          </h2>
          <p className="text-center text-slate-500 text-sm mb-8">
            {step === 'email' 
              ? 'Enter your email to sign in or create an account.' 
              : `We sent a 6-digit code to ${email}`}
          </p>

          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
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

              {error && (
                <div className="flex items-center gap-2 text-rose-600 text-xs font-bold bg-rose-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || !isConfigured}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 disabled:bg-slate-400 disabled:shadow-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Send Login Code 
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
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

              {message && (
                <div className="text-emerald-600 text-xs font-bold bg-emerald-50 p-3 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                  {message}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-rose-600 text-xs font-bold bg-rose-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Verify & Login
                    <ShieldCheck size={18} />
                  </>
                )}
              </button>
              
              <button 
                type="button"
                onClick={() => { setStep('email'); setError(''); }}
                className="w-full text-slate-500 text-sm font-bold hover:text-indigo-600 py-2"
              >
                Back to Email
              </button>
            </form>
          )}

          
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 opacity-70">
             <div className="bg-indigo-50 p-2 rounded-full">
               <Sparkles size={16} className="text-indigo-500" />
             </div>
             <p className="text-xs text-slate-500 font-medium">
                Passwordless Security by <strong>Supabase</strong>
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};