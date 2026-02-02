
import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import { 
  Plus, Layout, CheckCircle2, Target, Menu, Home, ListChecks, 
  LogOut, Moon, Sun, Cloud, BarChart3, Medal, Sparkles,
  Heart, Briefcase, GraduationCap, Compass, HelpCircle, 
  Trophy, Repeat, Calendar, Flag, ChevronDown, Rocket, Share2, Timer
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

import { Habit, Goal, Category, AppState, Frequency, User, DailyLog } from './types';
import { AuthScreen, TEST_ACCOUNT_ID } from './components/AuthScreen';
import { LandingPage } from './components/LandingPage';
import { HabitTracker } from './components/HabitTracker';
import { GoalTracker } from './components/GoalTracker';
import { AIOverview } from './components/AIOverview';
import { Modal } from './components/UIComponents';
import { FocusMode } from './components/FocusMode';

// Lazy loaded modules for performance
const Analytics = lazy(() => import('./components/Analytics').then(m => ({ default: m.Analytics })));
const Achievements = lazy(() => import('./components/Achievements').then(m => ({ default: m.Achievements })));
const KairoChat = lazy(() => import('./components/KairoChat').then(m => ({ default: m.KairoChat })));

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

// The specific requested identity for the demo architect: sam
const DEMO_USER_ID = '9639795c-0bcc-4757-bc48-d291377db139';
const DEMO_USER_EMAIL = 'samanyu@samanyukots.online';
const DEMO_USER_NAME = 'sam';

const COMMON_UNITS = ['Units', 'Pages', 'km', 'Hours', 'Minutes', 'Lessons', 'Tasks', 'Books', 'Chapters', 'Sets', 'Reps'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>({ habits: [], goals: [], logs: {}, earnedBadges: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  // Sidebar and Modal State
  const [isSidebarOpen, setSidebarOpen] = useState(false); 
  const [isHabitModalOpen, setHabitModalOpen] = useState(false);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [completedGoalCelebration, setCompletedGoalCelebration] = useState<Goal | null>(null);
  const [activeFocusHabit, setActiveFocusHabit] = useState<Habit | null>(null);

  // Form State
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<Category>(Category.OTHER);
  const [newHabitFrequency, setNewHabitFrequency] = useState<Frequency>(Frequency.DAILY);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState<number>(10);
  const [newGoalUnit, setNewGoalUnit] = useState('Units');
  const [newGoalFrequency, setNewGoalFrequency] = useState<Frequency>(Frequency.ONCE);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setSidebarOpen(false);
  };

  const loadUserData = useCallback(async (userData: User) => {
    const client = supabase; if (!client) { setIsLoaded(true); return; }
    try {
      const { data, error } = await client.from('user_data').select('content').eq('user_id', userData.id).single();
      if (data?.content) setState(data.content as AppState);
    } catch (err) {
        console.warn("Starting fresh record for architect:", userData.email);
    } finally { setIsLoaded(true); }
  }, []);

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Combined Auth Effect
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
            if (window.location.pathname === '/' || window.location.pathname === '/login') navigateTo('/dashboard');
        } else {
            setIsLoaded(true);
        }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            const userData: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || 'Architect'
            };
            setUser(userData);
            loadUserData(userData);
            navigateTo('/dashboard');
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setState({ habits: [], goals: [], logs: {}, earnedBadges: [] });
            navigateTo('/');
        }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // Achievement Engine
  useEffect(() => {
    if (!isLoaded || !user) return;

    const todayKey = getTodayKey();
    const todayLog = (state.logs[todayKey] || { completedHabitIds: [] }) as DailyLog;
    const totalCompletions = (Object.values(state.logs) as DailyLog[]).reduce((acc, log) => acc + log.completedHabitIds.length, 0);
    const hasActiveHabits = state.habits.length > 0;
    const maxStreak = Math.max(0, ...state.habits.map(h => h.streak));
    const hasCompletedGoal = state.goals.some(g => g.current >= g.target);

    const newBadges: string[] = [];
    if (hasActiveHabits) newBadges.push('first_step');
    if (state.habits.length >= 5) newBadges.push('architect');
    if (hasCompletedGoal) newBadges.push('goal_getter');
    if (maxStreak >= 3) newBadges.push('streak_3');
    if (maxStreak >= 7) newBadges.push('streak_7');
    if (maxStreak >= 30) newBadges.push('streak_30');
    if (totalCompletions >= 50) newBadges.push('consistent');
    if (hasActiveHabits && todayLog.completedHabitIds.length === state.habits.length) newBadges.push('high_flyer');

    const updatedBadges = [...new Set([...state.earnedBadges, ...newBadges])];
    
    if (updatedBadges.length !== state.earnedBadges.length) {
      setState(prev => ({ ...prev, earnedBadges: updatedBadges }));
    }
  }, [state.habits, state.goals, state.logs, isLoaded, user]);

  // Auto-Save
  useEffect(() => {
    if (!isLoaded || !user || user.id === TEST_ACCOUNT_ID || user.id === DEMO_USER_ID) return;

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
        console.error("Cloud Sync Error:", err);
        setSaveStatus('error'); 
      }
    };
    const timeoutId = setTimeout(saveData, 3000);
    return () => clearTimeout(timeoutId);
  }, [state, isLoaded, user]);

  const handleSignOut = async () => {
    setUser(null);
    setState({ habits: [], goals: [], logs: {}, earnedBadges: [] });
    if (supabase) await supabase.auth.signOut();
    navigateTo('/');
  };

  const handleStartDemo = () => {
    const demoHabits: Habit[] = [
        { id: 'h1', title: 'Run 5km', category: Category.HEALTH, streak: 12, frequency: Frequency.DAILY, createdAt: subDays(new Date(), 30).toISOString() },
        { id: 'h2', title: 'Read 20 Pages', category: Category.LEARNING, streak: 21, frequency: Frequency.DAILY, createdAt: subDays(new Date(), 40).toISOString() },
        { id: 'h3', title: 'Complete 1 Project', category: Category.WORK, streak: 4, frequency: Frequency.WEEKLY, createdAt: subDays(new Date(), 60).toISOString() },
        { id: 'h4', title: 'Check finances', category: Category.OTHER, streak: 8, frequency: Frequency.WEEKLY, createdAt: subDays(new Date(), 90).toISOString() },
        { id: 'h5', title: 'Complete 20 pyq', category: Category.LEARNING, streak: 2, frequency: Frequency.MONTHLY, createdAt: subDays(new Date(), 90).toISOString() },
    ];
    
    const demoGoals: Goal[] = [
        { id: 'g1', title: 'Run 50km', target: 50, current: 35, unit: 'km', frequency: Frequency.ONCE },
        { id: 'g2', title: 'Finish 5 books', target: 5, current: 2, unit: 'Books', frequency: Frequency.ONCE }
    ];

    const todayKey = getTodayKey();
    const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const dayBeforeKey = format(subDays(new Date(), 2), 'yyyy-MM-dd');

    const demoLogs: Record<string, DailyLog> = {
        [todayKey]: { date: todayKey, completedHabitIds: ['h1', 'h2'], goalProgress: {} },
        [yesterdayKey]: { date: yesterdayKey, completedHabitIds: ['h1', 'h2', 'h3'], goalProgress: {} },
        [dayBeforeKey]: { date: dayBeforeKey, completedHabitIds: ['h1', 'h2'], goalProgress: {} }
    };

    setState({
        habits: demoHabits,
        goals: demoGoals,
        logs: demoLogs,
        earnedBadges: ['first_step', 'streak_3', 'streak_7', 'architect']
    });

    setUser({
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL,
        name: DEMO_USER_NAME
    });

    navigateTo('/dashboard');
  };

  const toggleHabit = (id: string) => {
    const todayKey = getTodayKey();
    setState(prev => {
      const currentLog = prev.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };
      const isCompleted = currentLog.completedHabitIds.includes(id);
      const newCompletedIds = isCompleted 
        ? currentLog.completedHabitIds.filter(hid => hid !== id)
        : [...currentLog.completedHabitIds, id];

      if (!isCompleted && typeof window !== 'undefined' && (window as any).confetti) {
        (window as any).confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#10b981', '#6366f1']
        });
      }

      const updatedHabits = prev.habits.map(h => {
        if (h.id === id) {
          return { ...h, streak: !isCompleted ? h.streak + 1 : Math.max(0, h.streak - 1) };
        }
        return h;
      });

      return {
        ...prev,
        habits: updatedHabits,
        logs: { 
          ...prev.logs, 
          [todayKey]: { ...currentLog, completedHabitIds: newCompletedIds } 
        }
      };
    });
  };

  const handleUpdateGoalProgress = (id: string, delta: number) => {
    setState(prev => {
      const newGoals = prev.goals.map(g => {
        if (g.id === id) {
          const wasCompleted = g.current >= g.target;
          const newCurrent = Math.max(0, g.current + delta);
          const isNowCompleted = newCurrent >= g.target;

          if (!wasCompleted && isNowCompleted) {
            setCompletedGoalCelebration(g);
            if (typeof window !== 'undefined' && (window as any).confetti) {
              (window as any).confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#10b981', '#fbbf24', '#3b82f6']
              });
            }
          }
          return { ...g, current: newCurrent };
        }
        return g;
      });
      return { ...prev, goals: newGoals };
    });
  };

  const addHabit = () => {
    if (!newHabitTitle.trim()) return;
    const habitId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newHabit: Habit = { 
      id: habitId,
      title: newHabitTitle, 
      category: newHabitCategory, 
      createdAt: new Date().toISOString(), 
      streak: 0, 
      frequency: newHabitFrequency 
    };
    setState(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
    setNewHabitTitle(''); 
    setHabitModalOpen(false);
  };

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;
    const goalId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newGoal: Goal = {
      id: goalId,
      title: newGoalTitle,
      target: newGoalTarget,
      current: 0,
      unit: newGoalUnit,
      frequency: newGoalFrequency
    };
    setState(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    setNewGoalTitle('');
    setGoalModalOpen(false);
  };

  const renderContent = () => {
    const todayKey = getTodayKey();
    const todayLog = state.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };
    const percentage = state.habits.length > 0 ? Math.round((todayLog.completedHabitIds.length / state.habits.length) * 100) : 0;

    switch(currentPath) {
      case '/habits':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Your Habits</h2>
                <button onClick={() => setHabitModalOpen(true)} className="bg-violet-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-violet-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"><Plus size={20}/> New</button>
            </div>
            <HabitTracker habits={state.habits} completedHabitIds={todayLog.completedHabitIds} onToggleHabit={toggleHabit} onDeleteHabit={(id) => setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }))} onFocusHabit={(h) => setActiveFocusHabit(h)} />
          </div>
        );
      case '/goals':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Goals</h2>
                <button onClick={() => setGoalModalOpen(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"><Plus size={20}/> New Goal</button>
            </div>
            <GoalTracker goals={state.goals} onUpdateProgress={handleUpdateGoalProgress} onDeleteGoal={(id) => setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))} onOpenGoalModal={() => setGoalModalOpen(true)} />
          </div>
        );
      case '/insights':
        return (
          <Suspense fallback={<div className="h-64 flex items-center justify-center animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl" />}>
            <Analytics habits={state.habits} goals={state.goals} logs={state.logs} />
          </Suspense>
        );
      case '/trophies':
        return (
          <Suspense fallback={null}>
            <div className="space-y-12 animate-in fade-in duration-500">
               <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-10">Trophy Room</h2>
               <Achievements earnedBadgeIds={state.earnedBadges} />
            </div>
          </Suspense>
        );
      default: // Dashboard
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Design your <br /><span className="text-violet-600">Success.</span></h2>
              <div className="flex gap-3">
                <button onClick={() => setHabitModalOpen(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                  <Plus size={20} /> New Habit
                </button>
                <button onClick={() => setGoalModalOpen(true)} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                  <Target size={20} /> New Goal
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm transition-colors group">
                <CheckCircle2 className="text-emerald-500 group-hover:scale-110 transition-transform" size={32} />
                <span className="text-4xl font-black dark:text-white">{percentage}%</span>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Daily Trajectory</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-2 space-y-8">
                <AIOverview habits={state.habits} goals={state.goals} logs={state.logs} />
                <section id="habits-list" className="space-y-6">
                   <div className="flex items-center gap-2">
                     <ListChecks size={20} className="text-slate-400" />
                     <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Structural Blueprint</h3>
                   </div>
                  <HabitTracker habits={state.habits} completedHabitIds={todayLog.completedHabitIds} onToggleHabit={toggleHabit} onDeleteHabit={(id) => setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }))} onFocusHabit={(h) => setActiveFocusHabit(h)} />
                </section>
              </div>
              <div className="xl:col-span-1">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Target size={20} className="text-slate-400" />
                        <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Goals</h3>
                    </div>
                 </div>
                <GoalTracker goals={state.goals} onUpdateProgress={handleUpdateGoalProgress} onDeleteGoal={(id) => setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))} onOpenGoalModal={() => setGoalModalOpen(true)} />
              </div>
            </div>
          </div>
        );
    }
  };

  const categories = [
    { type: Category.HEALTH, icon: Heart },
    { type: Category.WORK, icon: Briefcase },
    { type: Category.LEARNING, icon: GraduationCap },
    { type: Category.MINDFULNESS, icon: Compass },
    { type: Category.OTHER, icon: HelpCircle }
  ];

  const frequencies = [
    { type: Frequency.DAILY, label: 'Daily' },
    { type: Frequency.WEEKLY, label: 'Weekly' },
    { type: Frequency.MONTHLY, label: 'Monthly' },
    { type: Frequency.ONCE, label: 'One-time' }
  ];

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors"><div className="w-12 h-12 border-4 border-t-violet-600 rounded-full animate-spin"></div></div>;
  if (!user && currentPath === '/login') return <AuthScreen onAuthSuccess={(u) => { setUser(u); navigateTo('/dashboard'); }} />;
  if (!user) return <LandingPage onStart={() => navigateTo('/login')} onDemo={handleStartDemo} />;

  return (
    <div id="root-container" className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform lg:relative lg:translate-x-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-violet-600 p-2.5 rounded-xl shadow-lg"><Layout className="text-white" size={24} /></div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Habit<span className="text-violet-500">Arch</span></h1>
          </div>
          <nav className="space-y-2 flex-1">
             <button onClick={() => navigateTo('/dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${currentPath === '/dashboard' || currentPath === '/' ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Home size={20} /> Vision</button>
             <button onClick={() => navigateTo('/habits')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${currentPath === '/habits' ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><ListChecks size={20} /> Habits</button>
             <button onClick={() => navigateTo('/goals')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${currentPath === '/goals' ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Target size={20} /> Goals</button>
             <button onClick={() => navigateTo('/insights')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${currentPath === '/insights' ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><BarChart3 size={20} /> Insights</button>
             <button onClick={() => navigateTo('/trophies')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${currentPath === '/trophies' ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Medal size={20} /> Trophies</button>
          </nav>
          <button onClick={handleSignOut} className="flex items-center gap-4 px-5 py-3 text-slate-400 hover:text-rose-600 transition-colors text-sm font-bold w-full mt-auto"><LogOut size={18} /> Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-white"><Menu /></button>
            <div className="flex items-center gap-6 ml-auto">
                <div className="hidden sm:flex items-center gap-2">
                    {saveStatus === 'saving' ? (
                        <div className="flex items-center gap-2 text-violet-500 animate-pulse">
                            <Cloud size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Syncing</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                            <CheckCircle2 size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Saved</span>
                        </div>
                    )}
                </div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-transform active:scale-90">{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                    <span className="hidden sm:inline font-bold text-sm text-slate-700 dark:text-slate-200">{user.name}</span>
                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black">{user.name[0]}</div>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 blueprint-grid relative">
            <div className="max-w-6xl mx-auto pb-24">
                {renderContent()}
            </div>
        </main>
      </div>

      <Suspense fallback={null}><KairoChat habits={state.habits} goals={state.goals} logs={state.logs} /></Suspense>

      {/* Habit Modal */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setHabitModalOpen(false)} title="New Habit">
          <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Habit Label</label>
                <input value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)} placeholder="e.g. Morning Meditation" className="w-full bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl font-bold border-2 border-slate-100 dark:border-slate-700 focus:border-violet-600 outline-none text-slate-900 dark:text-white" autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Frequency Cycle</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {frequencies.filter(f => f.type !== Frequency.ONCE).map((freq) => (
                    <button key={freq.type} onClick={() => setNewHabitFrequency(freq.type)} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${newHabitFrequency === freq.type ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                      {freq.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Category</label>
                <div className="grid grid-cols-5 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button key={cat.type} onClick={() => setNewHabitCategory(cat.type)} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-2 ${newHabitCategory === cat.type ? 'bg-violet-600 border-violet-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-300'}`}>
                        <Icon size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={addHabit} disabled={!newHabitTitle.trim()} className="w-full bg-violet-600 disabled:bg-slate-300 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-violet-700 transition-all flex items-center justify-center gap-3">
                <Plus size={24} strokeWidth={3} /> ESTABLISH HABIT
              </button>
          </div>
      </Modal>

      {/* Goal Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} title="New Goal">
          <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Goal Name</label>
                <input value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} placeholder="e.g. Run 50km" className="w-full bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl font-bold border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-600 outline-none text-slate-900 dark:text-white" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Goal Type</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setNewGoalFrequency(Frequency.ONCE)} 
                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${newGoalFrequency === Frequency.ONCE ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    ONE-TIME
                  </button>
                  <button 
                    onClick={() => setNewGoalFrequency(Frequency.DAILY)} 
                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${newGoalFrequency !== Frequency.ONCE ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    RECURRING
                  </button>
                </div>
              </div>

              {newGoalFrequency !== Frequency.ONCE && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Recurring Period</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {[Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY].map((f) => (
                      <button key={f} onClick={() => setNewGoalFrequency(f)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${newGoalFrequency === f ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Target</label>
                    <input type="number" value={newGoalTarget} onChange={e => setNewGoalTarget(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl font-bold border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-600 outline-none text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Common Unit</label>
                    <div className="relative group">
                      <select 
                        value={newGoalUnit} 
                        onChange={e => setNewGoalUnit(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl font-bold border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-600 outline-none text-slate-900 dark:text-white appearance-none pr-10"
                      >
                        {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        {!COMMON_UNITS.includes(newGoalUnit) && <option value={newGoalUnit}>{newGoalUnit}</option>}
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Custom Unit (Optional)</label>
                <input value={newGoalUnit} onChange={e => setNewGoalUnit(e.target.value)} placeholder="Or type custom unit..." className="w-full bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-xl font-bold border border-slate-100 dark:border-slate-700 focus:border-emerald-600 outline-none text-slate-900 dark:text-white text-sm" />
              </div>

              <button onClick={addGoal} disabled={!newGoalTitle.trim()} className="w-full bg-emerald-600 disabled:bg-slate-300 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                <Trophy size={20} /> SET GOAL
              </button>
          </div>
      </Modal>

      {/* Goal Completion Celebration Popup */}
      <Modal isOpen={!!completedGoalCelebration} onClose={() => setCompletedGoalCelebration(null)} title="Goal Achieved!">
          <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse"></div>
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200 dark:shadow-none relative z-10">
                    <Rocket className="text-white" size={48} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{completedGoalCelebration?.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 font-bold">Structural integrity maintained. Goal finalized.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 w-full">
                  <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                      <span>Achievement Detail</span>
                      <span className="text-emerald-600 dark:text-emerald-400">Validated</span>
                  </div>
                  <div className="text-left space-y-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Target: {completedGoalCelebration?.target} {completedGoalCelebration?.unit}</div>
                      <div className="text-xs font-medium text-slate-500">Status: Completed on {format(new Date(), 'MMM do, yyyy')}</div>
                  </div>
              </div>

              <button 
                onClick={() => setCompletedGoalCelebration(null)}
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all uppercase tracking-widest text-sm"
              >
                Continue Design
              </button>
          </div>
      </Modal>

      {/* Focus Mode Timer */}
      <FocusMode 
        isOpen={!!activeFocusHabit} 
        habitTitle={activeFocusHabit?.title}
        onClose={() => setActiveFocusHabit(null)}
        onComplete={() => {
          if (activeFocusHabit) toggleHabit(activeFocusHabit.id);
          setActiveFocusHabit(null);
        }}
      />
    </div>
  );
}
