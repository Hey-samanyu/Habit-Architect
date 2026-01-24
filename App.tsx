
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Plus, Calendar, Layout, BarChart3, CheckCircle2, Target, Menu, X, Home, ListChecks, PieChart, Activity, RotateCcw, Bell, LogOut, Medal, Sparkles as SparklesIcon, Moon, Sun } from 'lucide-react';
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

import { Modal } from './components/UIComponents';

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

// Map URL hash paths to the actual element IDs in the DOM
const PATH_TO_ID: Record<string, string> = {
  '#/dashboard': 'root',
  '#/routines': 'habits',
  '#/milestones': 'goals',
  '#/insights': 'analytics',
  '#/trophies': 'achievements'
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>({ habits: [], goals: [], logs: {}, earnedBadges: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  // Hash Routing State
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Navigation Helper (Hash-based)
  const navigateTo = (route: string) => {
    const hash = route.startsWith('#') ? route : `#${route}`;
    window.location.hash = hash;
    setCurrentHash(hash);
    
    const sectionId = PATH_TO_ID[hash];
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId === 'root' ? 'root-container' : sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
            if (currentHash === '#/login' || currentHash === '#/') navigateTo('#/dashboard');
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
            if (currentHash === '#/login' || currentHash === '#/') navigateTo('#/dashboard');
        } else {
            setUser(null);
            setState({ habits: [], goals: [], logs: {}, earnedBadges: [] });
            setIsLoaded(true);
            if (currentHash !== '#/') navigateTo('#/');
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
  const [currentHabitTab, setCurrentHabitTab] = useState<Frequency>(Frequency.DAILY);
  const [isSidebarOpen, setSidebarOpen] = useState(false); 
  const mainRef = useRef<HTMLDivElement>(null);

  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<Category>(Category.OTHER);
  const [newHabitFrequency, setNewHabitFrequency] = useState<Frequency>(Frequency.DAILY);
  const [newHabitReminder, setNewHabitReminder] = useState('');

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

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
    </div>
  );

  // Router Logic using Hash
  if (!user && currentHash === '#/login') return <AuthScreen onAuthSuccess={() => navigateTo('#/dashboard')} />;
  if (!user) return <LandingPage onStart={() => navigateTo('#/login')} />;

  const todayKey = getTodayKey();
  const todayLog = state.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };
  const percentage = state.habits.length > 0 ? Math.round((todayLog.completedHabitIds.length / state.habits.length) * 100) : 0;

  return (
    <div id="root-container" className="flex h-screen overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-500 ease-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center gap-4 mb-12 cursor-pointer" onClick={() => navigateTo('#/')}>
            <div className="bg-violet-600 p-3 rounded-2xl shadow-xl shadow-violet-200 dark:shadow-none">
              <Layout className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Habit<span className="text-violet-500">Arch.</span>
            </h1>
          </div>

          <nav className="space-y-3 flex-1">
            {[
              { id: 'dashboard', path: '#/dashboard', icon: Home, label: 'Vision' },
              { id: 'habits', path: '#/routines', icon: ListChecks, label: 'Routines' },
              { id: 'goals', path: '#/milestones', icon: Target, label: 'Milestones' },
              { id: 'analytics', path: '#/insights', icon: PieChart, label: 'Insights' },
              { id: 'achievements', path: '#/trophies', icon: Medal, label: 'Trophies' },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => { navigateTo(item.path); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all text-left ${
                  currentHash === item.path
                    ? 'bg-violet-600 text-white shadow-xl shadow-violet-200 dark:shadow-none scale-[1.02]' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon size={20} strokeWidth={2.5} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <button onClick={() => supabase?.auth.signOut()} className="flex items-center gap-4 px-5 py-3 text-slate-400 hover:text-rose-600 transition-colors text-sm font-bold w-full">
                  <LogOut size={18} /> Sign Out
              </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-8 lg:px-12 z-10 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-none border border-slate-200 dark:border-slate-700">
                  <Menu size={24} className="text-slate-900 dark:text-white" />
              </button>
              <div className="hidden lg:flex items-center gap-4 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                  <Calendar size={14} />
                  <span>{format(new Date(), 'EEEE, MMMM do')}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-all hover:scale-105"
                  title={isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200 hidden sm:block">{user.name}</span>
                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg dark:shadow-none">
                        {user.name[0]}
                    </div>
                </div>
            </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth blueprint-grid">
            <div className="max-w-6xl mx-auto space-y-12 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                          Success starts <br/>with <span className="text-violet-600 dark:text-violet-500">consistency.</span>
                        </h2>
                    </div>
                    <button onClick={() => setHabitModalOpen(true)} className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-[1.5rem] font-black shadow-2xl dark:shadow-none transition-all hover:scale-105 active:scale-95">
                        <Plus size={20} /> Create Routine
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard icon={<CheckCircle2 className="text-emerald-500" size={32}/>} title="Daily Trajectory" value={`${percentage}%`} progress={percentage} color="bg-emerald-500" />
                    <MetricCard icon={<Activity className="text-violet-500" size={32}/>} title="Total Systems" value={state.habits.length.toString()} />
                    <MetricCard icon={<Target className="text-indigo-500" size={32}/>} title="Active North Stars" value={state.goals.length.toString()} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    <div className="xl:col-span-8 space-y-12">
                        <AIOverview habits={state.habits} goals={state.goals} logs={state.logs} />
                        
                        <section id="habits" className="scroll-mt-28">
                             <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                  <div className="p-2 bg-violet-500/10 dark:bg-violet-400/10 rounded-xl text-violet-500 dark:text-violet-400"><ListChecks size={24}/></div>
                                  Today's Blueprint
                                </h3>
                                <div className="flex p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    {[Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setCurrentHabitTab(tab)}
                                        className={`px-5 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${
                                        currentHabitTab === tab 
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
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
                               <div className="p-2 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-xl text-indigo-500 dark:text-indigo-400"><Target size={24}/></div>
                               North Stars
                            </h3>
                            <GoalTracker goals={state.goals} onUpdateProgress={updateGoalProgress} onDeleteGoal={(id) => setState(prev => ({...prev, goals: prev.goals.filter(g => g.id !== id)}))} />
                        </section>
                    </div>
                </div>

                {/* Achievements section */}
                <section id="achievements" className="scroll-mt-28 mt-20">
                     <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                           <div className="p-2 bg-amber-500/10 dark:bg-amber-400/10 rounded-xl text-amber-500 dark:text-amber-400"><Medal size={24}/></div>
                           Architect Badges
                        </h3>
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          {state.earnedBadges.length} / 8 Unlocked
                        </div>
                     </div>
                    <Suspense fallback={null}><Achievements earnedBadgeIds={state.earnedBadges} /></Suspense>
                </section>
            </div>
        </main>
      </div>

      <Suspense fallback={null}>
        <KairoChat habits={state.habits} goals={state.goals} logs={state.logs} />
      </Suspense>

      <Modal isOpen={isHabitModalOpen} onClose={() => setHabitModalOpen(false)} title="New System">
          <div className="space-y-6">
              <input value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)} placeholder="Habit Name..." className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none font-bold text-lg border-2 border-transparent focus:border-violet-600 transition-all text-slate-900 dark:text-white"/>
              <div className="grid grid-cols-2 gap-4">
                  <select value={newHabitCategory} onChange={e => setNewHabitCategory(e.target.value as Category)} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold text-sm outline-none text-slate-900 dark:text-white border border-transparent focus:border-violet-600">
                      {Object.values(Category).map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c}</option>)}
                  </select>
                  <select value={newHabitFrequency} onChange={e => setNewHabitFrequency(e.target.value as Frequency)} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold text-sm outline-none text-slate-900 dark:text-white border border-transparent focus:border-violet-600">
                      {Object.values(Frequency).filter(f => f !== Frequency.ONCE).map(f => <option key={f} value={f} className="bg-white dark:bg-slate-800">{f}</option>)}
                  </select>
              </div>
              <button onClick={addHabit} className="w-full bg-violet-600 text-white p-5 rounded-2xl font-black shadow-xl hover:bg-violet-700 transition-all uppercase tracking-widest">ESTABLISH SYSTEM</button>
          </div>
      </Modal>
    </div>
  );
}

const MetricCard = ({ icon, title, value, progress, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] flex flex-col gap-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between">
          {icon}
          <span className="text-4xl font-black text-slate-900 dark:text-white">{value}</span>
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</p>
      {progress !== undefined && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
          </div>
      )}
  </div>
);
