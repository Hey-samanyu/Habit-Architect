import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Loader2, Layout, AlertCircle, User as UserIcon, Trash2 } from 'lucide-react';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate network delay for better UX
    setTimeout(() => {
      try {
        const usersStr = localStorage.getItem('habit_architect_users');
        let users: any[] = [];
        
        // ROBUST DATA LOADING
        if (usersStr) {
            try {
                const parsed = JSON.parse(usersStr);
                if (Array.isArray(parsed)) {
                    users = parsed;
                } else {
                    console.warn("User storage corrupted (not an array). Resetting user list.");
                    // Don't throw, just start with empty array
                    users = []; 
                }
            } catch (e) {
                console.warn("User storage corrupted (invalid JSON). Resetting user list.");
                users = [];
            }
        }

        if (isLogin) {
          // LOGIN LOGIC
          // Safe check using optional chaining just in case
          const foundUser = users?.find((u: any) => u && u.email === email && u.password === password);
          
          if (foundUser) {
            const userData: User = { id: foundUser.id, name: foundUser.name, email: foundUser.email };
            localStorage.setItem('habit_architect_session', JSON.stringify(userData));
            onAuthSuccess(userData);
          } else {
            throw new Error("Invalid email or password.");
          }
        } else {
          // SIGNUP LOGIC
          if (!name.trim()) throw new Error("Please enter your name.");
          
          // Safe check for duplicates
          const exists = users?.find((u: any) => u && u.email === email);
          if (exists) throw new Error("User already exists with this email.");

          const newUser = {
            id: crypto.randomUUID(),
            name,
            email,
            password // Note: In a real production app, passwords should be hashed!
          };

          const updatedUsers = [...users, newUser];
          localStorage.setItem('habit_architect_users', JSON.stringify(updatedUsers));
          
          const userData: User = { id: newUser.id, name: newUser.name, email: newUser.email };
          localStorage.setItem('habit_architect_session', JSON.stringify(userData));
          onAuthSuccess(userData);
        }
      } catch (err: any) {
        console.error("Auth Error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const handleFactoryReset = () => {
      if (confirm("⚠️ FACTORY RESET\n\nThis will delete ALL accounts and data on this device.\nThis cannot be undone.\n\nAre you sure?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

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

        <form onSubmit={handleAuth} className="space-y-5">
          
          {!isLogin && (
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
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
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
      
      {/* Emergency Reset Button */}
      <div className="absolute bottom-4 right-4">
          <button 
            onClick={handleFactoryReset}
            className="text-slate-300 hover:text-rose-500 transition-colors text-xs flex items-center gap-1"
            title="Clear all data and reset"
          >
              <Trash2 size={12} /> Reset App Data
          </button>
      </div>
    </div>
  );
};