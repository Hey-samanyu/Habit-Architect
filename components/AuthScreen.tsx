import React, { useState } from 'react';
import { Layout, ArrowRight, Lock, User as UserIcon, Mail, Sparkles } from 'lucide-react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      if (!username || !password || (!isLogin && !name)) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Simple local storage auth simulation
      const usersKey = 'habit_architect_users';
      const existingUsersStr = localStorage.getItem(usersKey);
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};

      if (isLogin) {
        // Login Logic
        const user = existingUsers[username];
        if (user && user.password === password) {
          onLogin({ username: user.username, name: user.name });
        } else {
          setError('Invalid username or password');
        }
      } else {
        // Signup Logic
        if (existingUsers[username]) {
          setError('Username already exists');
        } else {
          const newUser = { username, name, password };
          existingUsers[username] = newUser;
          localStorage.setItem(usersKey, JSON.stringify(existingUsers));
          onLogin({ username, name });
        }
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 relative z-10 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        
        <div className="p-8 w-full">
          <div className="flex items-center justify-center gap-3 mb-8">
             <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Layout className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Habit<span className="text-indigo-600">Architect</span>
            </h1>
          </div>

          <h2 className="text-xl font-bold text-center text-slate-800 mb-2">
            {isLogin ? 'Welcome back' : 'Start your journey'}
          </h2>
          <p className="text-center text-slate-500 text-sm mb-8">
            {isLogin ? 'Enter your details to access your tracker.' : 'Create an account to build better habits.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-rose-500 text-xs font-bold text-center bg-rose-50 py-2 rounded-lg">
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
                  {isLogin ? 'Sign In' : 'Create Account'} 
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="ml-1 font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
          
          {/* Kairo Teaser */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 opacity-70">
             <div className="bg-indigo-50 p-2 rounded-full">
               <Sparkles size={16} className="text-indigo-500" />
             </div>
             <p className="text-xs text-slate-500 font-medium">
                Includes <strong>Kairo AI</strong> coach integration
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};
