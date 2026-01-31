
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Plus, Layout, CheckCircle2, Target, Menu, Home, ListChecks, LogOut, Moon, Sun, CloudCheck, Cloud } from 'lucide-react';
import { format } from 'date-fns';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

import { Habit, Goal, Category, AppState, Frequency, User } from './types';
import { AuthScreen, TEST_ACCOUNT_ID } from './components/AuthScreen';
import { LandingPage } from './components/LandingPage';
import { HabitTracker } from './components/HabitTracker';
import { GoalTracker } from './components/GoalTracker';
import { AIOverview } from './components/AIOverview';

const KairoChat = lazy(() => import('./components/KairoChat').then(module => ({ default: module.KairoChat })));
import { Modal } from './components/UIComponents';

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

const PATH_TO_ID: Record<string, string> = {
  '/dashboard': 'root',
  '/routines': 'habits',
  '/milestones': 'goals'
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>({ habits: [], goals: [], logs: {}, earnedBadges: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const navigateTo = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    window.history.pushState({}, '', cleanPath);
    setCurrentPath(cleanPath);
    
    const sectionId = PATH_TO_ID[cleanPath];
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId === 'root' ? 'root-container' : sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured() || !client) { setIsLoaded(true); return; }

    client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
             const userData: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || 'Architect'
            };
            setUser(userData);
            loadUserData(userData);
            if (currentPath === '/login' || currentPath === '/') navigateTo('/dashboard');
        } else { setIsLoaded(true); }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
             const userData: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || 'Architect'
            };
            setUser(userData);
            loadUserData(userData);
            if (currentPath === '/login' || currentPath === '/') navigateTo('/dashboard');
        } else if (user && user.id !== TEST_ACCOUNT_ID) {
            setUser(null);
            setState({ habits: [], goals: [], logs: {}, earnedBadges: [] });
            setIsLoaded(true);
            if (currentPath !== '/') navigateTo('/');
        }
    });
    return () => subscription.unsubscribe();
  }, [user]);

  const loadUserData = async (userData: User) => {
    const client = supabase; if (!client) return;
    try {
      const { data, error } = await client.from('user_data').select('content').eq('user_id', userData.id).single();
      if (data?.content) setState(data.content as AppState);
    } catch (err) {
        console.warn("Starting with a fresh cloud record.");
    } finally { setIsLoaded(true); }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;

    const saveData = async () => {
      setSaveStatus('saving');
      const client = supabase; if (!client) return;
      try {
        const { error } = await client.from('user_data').upsert({ 
            user_id: user.id, 
            content: state, 
            updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id' });
        
        if (error) throw error;
        setSaveStatus('saved');
      } catch (err) { 
        console.error("Cloud Save Error:", err);
        setSaveStatus('error'); 
      }
    };
    const timeoutId = setTimeout(saveData, 1500);
    return () => clearTimeout(timeoutId);
  }, [state, isLoaded, user]);

  const [isHabitModalOpen, setHabitModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false); 
  const [newHabitTitle, setNewHabitTitle] = useState('');

  const toggleHabit = (id: string) => {
    const todayKey = getTodayKey();
    setState(prev => {
      const currentLog = prev.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };
      const isCompleted = currentLog.completedHabitIds.includes(id);
      const newCompletedIds = isCompleted 
        ? currentLog.completedHabitIds.filter(hid => hid !== id)
        : [...currentLog.completedHabitIds, id];

      return {
        ...prev,
        logs: { ...prev.logs, [todayKey]: { ...currentLog, completedHabitIds: newCompletedIds } }
      };
    });
  };

  const addHabit = () => {
    if (!newHabitTitle.trim()) return;
    const newHabit: Habit = { id: crypto.randomUUID(), title: newHabitTitle, category: Category.OTHER, createdAt: new Date().toISOString(), streak: 0, frequency: Frequency.DAILY };
    setState(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
    setNewHabitTitle(''); setHabitModalOpen(false);
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="w-12 h-12 border-4 border-t-violet-600 rounded-full animate-spin"></div></div>;
  if (!user && currentPath === '/login') return <AuthScreen onAuthSuccess={(u) => { setUser(u); navigateTo('/dashboard'); }} />;
  if (!user) return <LandingPage onStart={() => navigateTo('/login')} />;

  const todayKey = getTodayKey();
  const todayLog = state.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };
  const percentage = state.habits.length > 0 ? Math.round((todayLog.completedHabitIds.length / state.habits.length) * 100) : 0;

  return (
    <div id="root-container" className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform lg:relative lg:translate-x-0 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-violet-600 p-2.5 rounded-xl shadow-lg"><Layout className="text-white" size={24} /></div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Habit<span className="text-violet-500">Arch</span></h1>
          </div>
          <nav className="space-y-2 flex-1">
             <button onClick={() => navigateTo('/dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${currentPath === '/dashboard' ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Home size={20} /> Vision</button>
             <button onClick={() => navigateTo('/routines')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${currentPath === '/routines' ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><ListChecks size={20} /> Routines</button>
             <button onClick={() => navigateTo('/milestones')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${currentPath === '/milestones' ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Target size={20} /> Milestones</button>
          </nav>
          <button onClick={() => { if(user.id === TEST_ACCOUNT_ID) setUser(null); else supabase?.auth.signOut(); }} className="flex items-center gap-4 px-5 py-3 text-slate-400 hover:text-rose-600 transition-colors text-sm font-bold w-full mt-auto"><LogOut size={18} /> Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-white rounded-lg shadow-sm border"><Menu /></button>
            <div className="flex items-center gap-6 ml-auto">
                <div className="flex items-center gap-2">
                    {saveStatus === 'saving' ? (
                        <div className="flex items-center gap-2 text-violet-500 animate-pulse">
                            <Cloud size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Syncing</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                            <CloudCheck size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Cloud Saved</span>
                        </div>
                    )}
                </div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{user.name}</span>
                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-black">{user.name[0]}</div>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 blueprint-grid">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white">Design your <span className="text-violet-600">Success.</span></h2>
                    <button onClick={() => setHabitModalOpen(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"><Plus size={20} /> New Routine</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                        <CheckCircle2 className="text-emerald-500" size={32} />
                        <span className="text-3xl font-black dark:text-white">{percentage}%</span>
                        <p className="text-[10px] font-black uppercase text-slate-400">Daily Trajectory</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    <div className="xl:col-span-2 space-y-8">
                        <AIOverview habits={state.habits} goals={state.goals} logs={state.logs} />
                        <section id="habits">
                            <HabitTracker habits={state.habits} completedHabitIds={todayLog.completedHabitIds} onToggleHabit={toggleHabit} onDeleteHabit={(id) => setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }))} />
                        </section>
                    </div>
                    <div className="xl:col-span-1">
                        <GoalTracker goals={state.goals} onUpdateProgress={(id, delta) => setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, current: Math.max(0, g.current + delta) } : g) }))} onDeleteGoal={(id) => setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))} />
                    </div>
                </div>
            </div>
        </main>
      </div>

      <Suspense fallback={null}><KairoChat habits={state.habits} goals={state.goals} logs={state.logs} /></Suspense>

      <Modal isOpen={isHabitModalOpen} onClose={() => setHabitModalOpen(false)} title="New Routine">
          <div className="space-y-6">
              <input value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)} placeholder="What's the habit?" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold border-2 border-transparent focus:border-violet-600 outline-none text-slate-900 dark:text-white"/>
              <button onClick={addHabit} className="w-full bg-violet-600 text-white p-4 rounded-xl font-black shadow-lg">CREATE ROUTINE</button>
          </div>
      </Modal>
    </div>
  );
}
