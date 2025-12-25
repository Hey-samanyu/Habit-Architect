
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Plus, Calendar, Layout, BarChart3, CheckCircle2, Target, Menu, X, Home, ListChecks, PieChart, Activity, RotateCcw, Bell, LogOut, Medal, Moon, Sun, AlertTriangle, Sparkles as SparklesIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

import { Habit, Goal, Category, AppState, Frequency, DailyLog, User, Badge } from './types';
import { AuthScreen } from './components/AuthScreen';
import { LandingPage } from './components/LandingPage';
import { HabitTracker } from './components/HabitTracker';
import { GoalTracker } from './components/GoalTracker';
import { AIOverview } from './components/AIOverview';
const Analytics = lazy(() => import('./components/Analytics').then(module => ({ default: module.Analytics })));
const KairoChat = lazy(() => import('./components/KairoChat').then(module => ({ default: module.KairoChat })));
const Achievements = lazy(() => import('./components/Achievements').then(module => ({ default: module.Achievements })));

import { BADGES_LIST } from './components/Achievements';
import { Modal, Card } from './components/UIComponents';

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>({ habits: [], goals: [], logs: {}, earnedBadges: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
               (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const triggerConfetti = (isBig = false) => {
    // @ts-ignore
    if (typeof confetti !== 'undefined') {
      // @ts-ignore
      confetti({
        particleCount: isBig ? 250 : 80,
        spread: isBig ? 120 : 60,
        origin: { y: 0.7 },
        colors: ['#7c3aed', '#6366f1', '#d946ef', '#10b981']
      });
    }
  };

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
            loadUserData(userData.id);
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
            loadUserData(userData.id);
        } else {
            setUser(null);
            setState({ habits: [], goals: [], logs: {}, earnedBadges: [] });
            setIsLoaded(true);
        }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    const client = supabase; if (!client) return;
    try {
      const { data } = await client.from('user_data').select('content').eq('user_id', userId).single();
      if (data?.content) setState(data.content as AppState);
    } finally { setIsLoaded(true); }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    const client = supabase; if (!client) return;
    const saveData = async () => {
      setSaveStatus('saving');
      try {
        await client.from('user_data').upsert({ user_id: user.id, content: state, updated_at: new Date().toISOString() });
        setSaveStatus('saved');
      } catch { setSaveStatus('error'); }
    };
    const timeoutId = setTimeout(saveData, 2000);
    return () => clearTimeout(timeoutId);
  }, [state, isLoaded, user]);

  const [isHabitModalOpen, setHabitModalOpen] = useState(false);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [currentHabitTab, setCurrentHabitTab] = useState<Frequency>(Frequency.DAILY);
  const [isSidebarOpen, setSidebarOpen] = useState(false); 
  const [activeSection, setActiveSection] = useState('dashboard');
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<Category>(Category.OTHER);
  const [newHabitFrequency, setNewHabitFrequency] = useState<Frequency>(Frequency.DAILY);
  const [newHabitReminder, setNewHabitReminder] = useState('');

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  const [newGoalUnit, setNewGoalUnit] = useState('times');
  const [newGoalFrequency, setNewGoalFrequency] = useState<Frequency>(Frequency.ONCE);

  const toggleHabit = (id: string) => {
    const todayKey = getTodayKey();
    setState(prev => {
      const currentLog = prev.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };
      const isCompleted = currentLog.completedHabitIds.includes(id);
      
      if (!isCompleted) triggerConfetti(false);

      const newCompletedIds = isCompleted 
        ? currentLog.completedHabitIds.filter(hid => hid !== id)
        : [...currentLog.completedHabitIds, id];

      const updatedHabits = prev.habits.map(h => {
        if (h.id === id && h.frequency === Frequency.DAILY) {
            return { ...h, streak: isCompleted ? Math.max(0, h.streak - 1) : h.streak + 1 };
        }
        return h;
      });

      // Special check: if this was the last habit for the day, trigger BIG confetti
      const totalDailyHabits = updatedHabits.filter(h => h.frequency === Frequency.DAILY).length;
      if (!isCompleted && newCompletedIds.length === totalDailyHabits && totalDailyHabits > 0) {
        triggerConfetti(true);
      }

      return {
        ...prev,
        habits: updatedHabits,
        logs: { ...prev.logs, [todayKey]: { ...currentLog, completedHabitIds: newCompletedIds } }
      };
    });
  };

  const addHabit = () => {
    if (!newHabitTitle.trim()) return;
    const newHabit: Habit = { id: crypto.randomUUID(), title: newHabitTitle, category: newHabitCategory, createdAt: new Date().toISOString(), streak: 0, frequency: newHabitFrequency, reminderTime: newHabitReminder || undefined };
    setState(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
    setNewHabitTitle(''); setHabitModalOpen(false);
  };

  const deleteHabit = (id: string) => setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;
    const newGoal: Goal = { id: crypto.randomUUID(), title: newGoalTitle, current: 0, target: Number(newGoalTarget), unit: newGoalUnit, frequency: newGoalFrequency };
    setState(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    setNewGoalTitle(''); setGoalModalOpen(false);
  };

  const updateGoalProgress = (id: string, delta: number) => {
    setState(prev => {
      return { ...prev, goals: prev.goals.map(g => {
          if (g.id === id) {
            const nextVal = Math.max(0, g.current + delta);
            if (nextVal >= g.target && g.current < g.target) triggerConfetti(true);
            return { ...g, current: nextVal };
          }
          return g;
      })};
    });
  };

  const scrollToSection = (id: string) => {
    setSidebarOpen(false); setActiveSection(id);
    if (id === 'dashboard') { mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
        </div>
    </div>
  );

  if (!user && showAuth) return <AuthScreen onAuthSuccess={() => setShowAuth(false)} />;
  if (!user) return <LandingPage onStart={() => setShowAuth(true)} isDarkMode={darkMode} toggleDarkMode={toggleDarkMode} />;

  const todayKey = getTodayKey();
  const todayLog = state.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };
  const percentage = state.habits.length > 0 ? Math.round((todayLog.completedHabitIds.length / state.habits.length) * 100) : 0;

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass-card border-r border-white/10 transform transition-transform duration-500 ease-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-3 rounded-2xl shadow-xl shadow-violet-500/20 animate-pulse-slow">
              <Layout className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Habit<span className="text-violet-500">Arch.</span>
            </h1>
          </div>

          <nav className="space-y-3 flex-1">
            {[
              { id: 'dashboard', icon: Home, label: 'Vision' },
              { id: 'habits', icon: ListChecks, label: 'Routines' },
              { id: 'goals', icon: Target, label: 'Milestones' },
              { id: 'analytics', icon: PieChart, label: 'Insights' },
              { id: 'achievements', icon: Medal, label: 'Trophies' },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => scrollToSection(item.id)} 
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all text-left ${
                  activeSection === item.id
                    ? 'bg-violet-600 text-white shadow-xl shadow-violet-500/30 scale-[1.02]' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon size={20} strokeWidth={2.5} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <button onClick={toggleDarkMode} className="flex items-center gap-4 px-5 py-3 w-full text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                {darkMode ? 'Day Mode' : 'Night Mode'}
              </button>
              <button onClick={() => supabase?.auth.signOut()} className="flex items-center gap-4 px-5 py-3 text-slate-400 hover:text-rose-500 transition-colors text-sm font-bold w-full">
                  <LogOut size={18} /> Sign Out
              </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-8 lg:px-12 z-10 shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
                <Menu size={24} />
            </button>
            <div className="hidden lg:flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                <Calendar size={14} />
                <span>{format(new Date(), 'EEEE, MMMM do')}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{user.name}</span>
                    <div className="w-10 h-10 bg-gradient-to-tr from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                        {user.name[0]}
                    </div>
                </div>
            </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
            <div className="max-w-6xl mx-auto space-y-12">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                          Success starts <br/>with <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500">consistency.</span>
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setHabitModalOpen(true)} className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-4 rounded-[1.5rem] font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                            <Plus size={20} /> Create Routine
                        </button>
                    </div>
                </div>

                {/* Aesthetic Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-8 rounded-[2rem] flex flex-col gap-4 border-l-4 border-l-emerald-500">
                        <div className="flex items-center justify-between">
                            <CheckCircle2 className="text-emerald-500" size={32} />
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{percentage}%</span>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Daily Trajectory</p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                        </div>
                    </div>
                    <div className="glass-card p-8 rounded-[2rem] flex flex-col gap-4 border-l-4 border-l-violet-500">
                        <div className="flex items-center justify-between">
                            <Activity className="text-violet-500" size={32} />
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{state.habits.length}</span>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Systems</p>
                    </div>
                    <div className="glass-card p-8 rounded-[2rem] flex flex-col gap-4 border-l-4 border-l-indigo-500">
                        <div className="flex items-center justify-between">
                            <Target className="text-indigo-500" size={32} />
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{state.goals.length}</span>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Active North Stars</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    <div className="xl:col-span-8 space-y-12">
                        <AIOverview habits={state.habits} goals={state.goals} logs={state.logs} />
                        
                        <section id="habits" className="scroll-mt-28">
                             <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                  <div className="p-2 bg-violet-500/10 rounded-xl text-violet-500"><ListChecks size={24}/></div>
                                  Today's Blueprint
                                </h3>
                                <div className="flex p-1.5 glass-card rounded-2xl">
                                    {[Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setCurrentHabitTab(tab)}
                                        className={`px-5 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${
                                        currentHabitTab === tab 
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                    ))}
                                </div>
                            </div>
                            <HabitTracker habits={state.habits.filter(h => h.frequency === currentHabitTab)} completedHabitIds={todayLog.completedHabitIds} onToggleHabit={toggleHabit} onDeleteHabit={deleteHabit} />
                        </section>

                        <section id="analytics" className="scroll-mt-28">
                            <Suspense fallback={null}><Analytics habits={state.habits} goals={state.goals} logs={state.logs} /></Suspense>
                        </section>
                    </div>

                    <div className="xl:col-span-4 space-y-10">
                        <section id="goals" className="scroll-mt-28">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                               <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Target size={24}/></div>
                               North Stars
                            </h3>
                            <GoalTracker goals={state.goals} onUpdateProgress={updateGoalProgress} onDeleteGoal={(id) => setState(prev => ({...prev, goals: prev.goals.filter(g => g.id !== id)}))} />
                        </section>
                    </div>
                </div>
            </div>
        </main>
      </div>

      <Suspense fallback={null}>
        <KairoChat habits={state.habits} goals={state.goals} logs={state.logs} />
      </Suspense>

      {/* Overhauled Modals */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setHabitModalOpen(false)} title="New System">
          <div className="space-y-6">
              <input value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)} placeholder="Habit Name..." className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none font-bold text-lg border-2 border-transparent focus:border-violet-500 transition-all"/>
              <div className="grid grid-cols-2 gap-4">
                  <select value={newHabitCategory} onChange={e => setNewHabitCategory(e.target.value as Category)} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold text-sm outline-none">
                      {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={newHabitFrequency} onChange={e => setNewHabitFrequency(e.target.value as Frequency)} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold text-sm outline-none">
                      {Object.values(Frequency).filter(f => f !== Frequency.ONCE).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
              </div>
              <button onClick={addHabit} className="w-full bg-violet-600 text-white p-5 rounded-2xl font-black shadow-xl hover:shadow-violet-500/20 active:scale-95 transition-all">ESTABLISH SYSTEM</button>
          </div>
      </Modal>
    </div>
  );
}
