import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Loader2, Layout, AlertCircle, User as UserIcon, KeyRound } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false); // For "Forgot Password"
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!isFirebaseConfigured() || !auth) {
        setError("Firebase connection missing. Please check API keys.");
        setLoading(false);
        return;
    }

    try {
      if (isResetMode) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage("Password reset email sent! Check your inbox.");
        setIsResetMode(false);
      } else if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        onAuthSuccess({
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Architect'
        });
      } else {
        if (!name.trim()) throw new Error("Please enter your name");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // Update profile with name
        await updateProfile(fbUser, {
            displayName: name
        });

        onAuthSuccess({
            id: fbUser.uid,
            email: fbUser.email || '',
            name: name
        });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "An unexpected error occurred.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseConfigured()) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-rose-50 p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                  <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Configuration Error</h2>
                  <p className="text-slate-600 mb-4">
                      The app cannot connect to Firebase. API keys are missing.
                  </p>
                  <div className="text-left bg-slate-100 p-4 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto">
                      FIREBASE_API_KEY<br/>
                      FIREBASE_PROJECT_ID<br/>
                      ... (See documentation)
                  </div>
                  <p className="text-slate-500 text-xs mt-4">Add these to Vercel Environment Variables and Redeploy.</p>
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
          <p className="text-slate-500 mt-2">Design your life, one habit at a time.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-rose-600 font-medium">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <KeyRound className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-emerald-600 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          
          {!isLogin && !isResetMode && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Full Name</label>
                <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon size={20} />
                </div>
                <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
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
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {!isResetMode && (
            <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                    <label className="block text-sm font-bold text-slate-700">Password</label>
                    {isLogin && (
                        <button 
                            type="button" 
                            onClick={() => setIsResetMode(true)}
                            className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                            Forgot?
                        </button>
                    )}
                </div>
                <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={20} />
                </div>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                    placeholder="••••••••"
                    minLength={6}
                />
                </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isResetMode ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account')}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
            {isResetMode ? (
                <button
                    onClick={() => setIsResetMode(false)}
                    className="text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
                >
                    Back to Sign In
                </button>
            ) : (
                <p className="text-slate-500 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="ml-1.5 text-indigo-600 font-bold hover:underline focus:outline-none"
                    >
                    {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                </p>
            )}
        </div>
      </div>
    </div>
  );
};