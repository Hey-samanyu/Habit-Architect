import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Plus, Calendar, Layout, BarChart3, CheckCircle2, Target, Menu, X, Home, ListChecks, PieChart, Activity, RotateCcw, Bell, LogOut, Medal, Moon, Sun } from 'lucide-react';
import { format } from 'date-fns';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

import { Habit, Goal, Category, AppState, Frequency, DailyLog, User, Badge } from './types';
import { AuthScreen } from './components/AuthScreen';
import { HabitTracker } from './components/HabitTracker';
import { GoalTracker } from './components/GoalTracker';
import { AIOverview } from './components/AIOverview';
// Lazy load heavy components
const Analytics = lazy(() => import('./components/Analytics').then(module => ({ default: module.Analytics })));
const KairoChat = lazy(() => import('./components/KairoChat').then(module => ({ default: module.KairoChat })));
const Achievements = lazy(() => import('./components/Achievements').then(module => ({ default: module.Achievements })));

import { BADGES_LIST } from './components/Achievements';
import { Modal, Card } from './components/UIComponents';

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

const SectionLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>({ habits: [], goals: [], logs: {}, earnedBadges: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Dark Mode State
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

  // --- Authentication & Data Loading (Supabase) ---
  
  useEffect(() => {
    const client = supabase;

    if (!isSupabaseConfigured() || !client) {
        setIsLoaded(true);
        return;
    }

    // Check active session
    client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
             const userData: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || 'Architect'
            };
            setUser(userData);
            loadUserData(userData.id);
        } else {
            setIsLoaded(true);
        }
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
    const client = supabase;
    if (!client) return;

    try {
      const { data, error } = await client
        .from('user_data')
        .select('content')
        .eq('user_id', userId)
        .single();

      if (data && data.content) {
         const loadedState = data.content as AppState;
         if (!loadedState.earnedBadges) loadedState.earnedBadges = [];
         setState(loadedState);
      } else if (error && error.code !== 'PGRST116') {
         console.error("Error loading data:", error);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    const client = supabase;
    if (!client) return;
    
    const saveData = async () => {
      setSaveStatus('saving');
      try {
        const { error } = await client
            .from('user_data')
            .upsert({ 
                user_id: user.id, 
                content: state,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        setSaveStatus('saved');
      } catch (err) {
        console.error("Error saving data:", err);
        setSaveStatus('error');
      }
    };

    const timeoutId = setTimeout(saveData, 2000); // Debounce increased to 2s to reduce writes
    return () => clearTimeout(timeoutId);
  }, [state, isLoaded, user]);

  const handleAuthSuccess = (userData: User) => {
    // Auth listener handles setting user state
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };


  // --- UI State ---
  const [isHabitModalOpen, setHabitModalOpen] = useState(false);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [currentHabitTab, setCurrentHabitTab] = useState<Frequency>(Frequency.DAILY);
  const [isSidebarOpen, setSidebarOpen] = useState(false); 
  const [activeSection, setActiveSection] = useState('dashboard');
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Form State
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<Category>(Category.OTHER);
  const [newHabitFrequency, setNewHabitFrequency] = useState<Frequency>(Frequency.DAILY);
  const [newHabitReminder, setNewHabitReminder] = useState('');

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  const [newGoalUnit, setNewGoalUnit] = useState('times');
  const [newGoalFrequency, setNewGoalFrequency] = useState<Frequency>(Frequency.ONCE);

  const lastCheckedMinute = useRef<string>("");

  const checkAchievements = (newState: AppState) => {
      const earned = new Set(newState.earnedBadges);
      const newBadges: string[] = [];
      const todayKey = getTodayKey();

      if (newState.habits.length >= 1 && !earned.has('first_step')) newBadges.push('first_step');

      const maxStreak = Math.max(...newState.habits.map(h => h.streak), 0);
      if (maxStreak >= 3 && !earned.has('streak_3')) newBadges.push('streak_3');
      if (maxStreak >= 7 && !earned.has('streak_7')) newBadges.push('streak_7');
      if (maxStreak >= 30 && !earned.has('streak_30')) newBadges.push('streak_30');

      if (newState.habits.length >= 5 && !earned.has('architect')) newBadges.push('architect');

      const completedGoals = newState.goals.filter(g => g.current >= g.target).length;
      if (completedGoals >= 1 && !earned.has('goal_getter')) newBadges.push('goal_getter');

      const totalCompletions = Object.values(newState.logs).reduce((acc, log) => acc + log.completedHabitIds.length, 0);
      if (totalCompletions >= 50 && !earned.has('consistent')) newBadges.push('consistent');

      const todayLog = newState.logs[todayKey];
      const todayCompleted = todayLog ? todayLog.completedHabitIds.length : 0;
      const activeHabits = newState.habits.length;
      if (activeHabits > 0 && todayCompleted === activeHabits && !earned.has('high_flyer')) newBadges.push('high_flyer');

      if (newBadges.length > 0) {
          const updatedEarnedBadges = [...newState.earnedBadges, ...newBadges];
          const badgeDef = BADGES_LIST.find(b => b.id === newBadges[0]);
          if (badgeDef) setNewBadge(badgeDef);
          return { ...newState, earnedBadges: updatedEarnedBadges };
      }

      return newState;
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTimeStr = format(now, 'HH:mm');
      const todayKey = format(now, 'yyyy-MM-dd');

      if (currentTimeStr === lastCheckedMinute.current) return;
      lastCheckedMinute.current = currentTimeStr;

      const todayLog = state.logs[todayKey] || { completedHabitIds: [] };
      
      state.habits.forEach(habit => {
        if (
          habit.reminderTime === currentTimeStr && 
          !todayLog.completedHabitIds.includes(habit.id)
        ) {
          if (Notification.permission === 'granted') {
             new Notification(`Habit Reminder: ${habit.title}`, {
               body: `Time to ${habit.title.toLowerCase()}! Keep your streak alive! 🔥`,
               icon: '/favicon.ico'
             });
          }
        }
      });
    }, 10000); 

    return () => clearInterval(interval);
  }, [state.habits, state.logs]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const observerOptions = {
      root: main,
      threshold: 0.1, // Reduced threshold for better mobile performance
      rootMargin: '-10% 0px -50% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id) {
            setActiveSection(entry.target.id);
        }
      });
      if (main.scrollTop < 100) setActiveSection('dashboard');
    }, observerOptions);

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isLoaded]); 

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Building your architect...</p>
        </div>
    </div>
  );

  if (!user) {
      return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const todayKey = getTodayKey();
  const todayLog = state.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const resetData = () => {
      if(confirm("This will wipe your data. Are you sure?")) {
         setState({ habits: [], goals: [], logs: {}, earnedBadges: [] });
      }
  }

  const openHabitModal = () => {
    setNewHabitFrequency(currentHabitTab);
    setHabitModalOpen(true);
  }

  const addHabit = () => {
    if (!newHabitTitle.trim()) return;
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      title: newHabitTitle,
      category: newHabitCategory,
      createdAt: new Date().toISOString(),
      streak: 0,
      frequency: newHabitFrequency,
      reminderTime: newHabitReminder || undefined
    };
    
    setState(prev => {
        const nextState = { ...prev, habits: [...prev.habits, newHabit] };
        return checkAchievements(nextState);
    });

    setNewHabitTitle('');
    setNewHabitReminder('');
    setHabitModalOpen(false);
  };

  const deleteHabit = (id: string) => {
    setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
  };

  const toggleHabit = (id: string) => {
    setState(prev => {
      const currentLog = prev.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };
      const isCompleted = currentLog.completedHabitIds.includes(id);
      
      let newCompletedIds;
      if (isCompleted) {
        newCompletedIds = currentLog.completedHabitIds.filter(hid => hid !== id);
      } else {
        newCompletedIds = [...currentLog.completedHabitIds, id];
      }

      const updatedHabits = prev.habits.map(h => {
        if (h.id === id && h.frequency === Frequency.DAILY) {
            return { ...h, streak: isCompleted ? Math.max(0, h.streak - 1) : h.streak + 1 };
        }
        return h;
      });

      const nextState = {
        ...prev,
        habits: updatedHabits,
        logs: {
          ...prev.logs,
          [todayKey]: { ...currentLog, completedHabitIds: newCompletedIds }
        }
      };

      return checkAchievements(nextState);
    });
  };

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: newGoalTitle,
      current: 0,
      target: Number(newGoalTarget),
      unit: newGoalUnit,
      frequency: newGoalFrequency
    };
    setState(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    setNewGoalTitle('');
    setNewGoalTarget(10);
    setNewGoalUnit('times');
    setNewGoalFrequency(Frequency.ONCE);
    setGoalModalOpen(false);
  };

  const deleteGoal = (id: string) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  };

  const updateGoalProgress = (id: string, delta: number) => {
    setState(prev => {
      const nextState = {
        ...prev,
        goals: prev.goals.map(g => {
          if (g.id === id) {
            return { ...g, current: Math.max(0, g.current + delta) };
          }
          return g;
        })
      };
      return checkAchievements(nextState);
    });
  };

  const scrollToSection = (id: string) => {
    setSidebarOpen(false); 
    setActiveSection(id);
    
    if (id === 'dashboard') {
       if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
       return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredHabits = state.habits.filter(h => h.frequency === currentHabitTab);

  const completedCount = todayLog.completedHabitIds.length;
  const totalHabits = state.habits.length;
  const percentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-black text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-violet-600 p-2 rounded-xl shadow-lg shadow-violet-900/20">
              <Layout className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Habit<span className="text-violet-400">Architect</span>
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400 hover:text-white">
                <X size={24} />
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            {[
              { id: 'dashboard', icon: Home, label: 'Dashboard' },
              { id: 'habits', icon: ListChecks, label: 'My Habits' },
              { id: 'goals', icon: Target, label: 'Goals' },
              { id: 'analytics', icon: PieChart, label: 'Analytics' },
              { id: 'achievements', icon: Medal, label: 'Achievements' },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => scrollToSection(item.id)} 
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all text-left ${
                  activeSection === item.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
              {/* Dark Mode Toggle in Sidebar */}
              <div className="px-4">
                 <button 
                  onClick={toggleDarkMode}
                  className="flex items-center gap-3 w-full text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>

              <div className="px-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${saveStatus === 'error' ? 'border-rose-800 text-rose-400 bg-rose-950/30' : 'border-emerald-800 text-emerald-400 bg-emerald-950/30'}`}>
                    {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'error' ? 'Sync Error' : 'Cloud Data'}
                  </span>
              </div>
              <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 transition-colors text-sm font-medium w-full">
                  <LogOut size={18} />
                  Sign Out
              </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 z-10 shrink-0 transition-colors">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300">
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                    <Calendar size={14} />
                    <span>{format(new Date(), 'EEEE, MMM do')}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <span className="hidden md:inline">{user.name}</span>
                    <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-full border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold text-xs uppercase">
                        {user.name[0]}
                    </div>
                </div>
            </div>
        </header>

        {/* Scrollable Content Area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Hero */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">{getGreeting()}, {user.name.split(' ')[0]}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your goals today.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={openHabitModal} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-200 dark:shadow-none transition-all active:scale-95 text-sm">
                            <Plus size={18} /> Add Habit
                        </button>
                        <button onClick={() => setGoalModalOpen(true)} className="flex items-center gap-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-sm">
                            <Target size={18} /> Add Goal
                        </button>
                        <button onClick={resetData} className="flex items-center gap-2 bg-white hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-sm" title="Reset Data">
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <Card className="p-5 flex items-center gap-5 border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Daily Completion</p>
                            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{percentage}%</p>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-5 border-l-4 border-l-violet-500 dark:border-l-violet-400">
                        <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                             <BarChart3 size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Habits</p>
                            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{state.habits.length}</p>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-5 border-l-4 border-l-amber-500 dark:border-l-amber-400">
                        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Active Goals</p>
                            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{state.goals.length}</p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        <AIOverview habits={state.habits} goals={state.goals} logs={state.logs} />

                        <section id="habits" className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 scroll-mt-20 transition-colors">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <ListChecks className="text-violet-600 dark:text-violet-400" size={20} />
                                        Your Checklist
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your daily tasks</p>
                                </div>
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl self-start sm:self-auto">
                                    {[Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setCurrentHabitTab(tab)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        currentHabitTab === tab 
                                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                    ))}
                                </div>
                            </div>
                            <HabitTracker 
                                habits={filteredHabits} 
                                completedHabitIds={todayLog.completedHabitIds}
                                onToggleHabit={toggleHabit}
                                onDeleteHabit={deleteHabit}
                            />
                        </section>

                         <section id="analytics" className="scroll-mt-20">
                            <Suspense fallback={<SectionLoader />}>
                                <Analytics habits={state.habits} goals={state.goals} logs={state.logs} />
                            </Suspense>
                        </section>

                        <section id="achievements" className="scroll-mt-20">
                             <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Medal className="text-amber-500" size={20} />
                                        Achievements
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Badges you've unlocked</p>
                                </div>
                            </div>
                            <Suspense fallback={<SectionLoader />}>
                                <Achievements earnedBadgeIds={state.earnedBadges} />
                            </Suspense>
                        </section>
                    </div>

                    <div className="space-y-8">
                         <section id="goals" className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 scroll-mt-20 transition-colors">
                             <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Target className="text-violet-600 dark:text-violet-400" size={20} />
                                        Active Goals
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Track your milestones</p>
                                </div>
                            </div>
                            <GoalTracker 
                                goals={state.goals} 
                                onUpdateProgress={updateGoalProgress}
                                onDeleteGoal={deleteGoal}
                            />
                        </section>
                        
                         <div className="bg-gradient-to-br from-violet-600 to-indigo-700 dark:from-violet-800 dark:to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                             <div className="relative z-10">
                                 <h4 className="font-bold text-lg mb-2">Keep it up! 🚀</h4>
                                 <p className="text-violet-100 dark:text-violet-200 text-sm leading-relaxed mb-4">
                                     Consistency is key. You're doing great. Check back in tomorrow to keep your streak alive.
                                 </p>
                                 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-200 dark:text-violet-300">
                                     <Activity size={14} />
                                     Habit Architect AI
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>

      <Suspense fallback={null}>
        <KairoChat habits={state.habits} goals={state.goals} logs={state.logs} />
      </Suspense>

      {/* Badge Unlock Modal */}
      {newBadge && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center relative overflow-hidden animate-in zoom-in duration-300 border border-white/10">
                <button 
                    onClick={() => setNewBadge(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                    <X size={24} />
                </button>
                
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-violet-50 dark:from-violet-900/40 to-transparent -z-10"></div>

                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce ${newBadge.color} text-white`}>
                    <Medal size={48} />
                </div>

                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Badge Unlocked!</h2>
                <h3 className="text-xl font-bold text-violet-600 dark:text-violet-400 mb-2">{newBadge.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">{newBadge.description}</p>

                <button 
                    onClick={() => setNewBadge(null)}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-200 dark:shadow-none transition-all active:scale-95"
                >
                    Awesome!
                </button>
            </div>
        </div>
      )}

      <Modal isOpen={isHabitModalOpen} onClose={() => setHabitModalOpen(false)} title="Create New Habit">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Habit Name</label>
            <input 
              type="text" 
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="e.g. Morning Meditation"
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/30 px-4 py-2.5 border transition-all outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 font-medium text-slate-800 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
              <div className="relative">
                <select 
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value as Category)}
                  className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/30 px-4 py-2.5 border transition-all outline-none appearance-none font-medium text-slate-800 dark:text-white"
                >
                  {Object.values(Category).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                   <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Frequency</label>
              <div className="relative">
                <select 
                  value={newHabitFrequency}
                  onChange={(e) => setNewHabitFrequency(e.target.value as Frequency)}
                  className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/30 px-4 py-2.5 border transition-all outline-none appearance-none font-medium text-slate-800 dark:text-white"
                >
                  {[Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY].map((freq) => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                   <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Daily Reminder (Optional)</label>
            <div className="relative">
              <input 
                type="time"
                value={newHabitReminder}
                onChange={(e) => setNewHabitReminder(e.target.value)}
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/30 px-4 py-2.5 border transition-all outline-none font-medium text-slate-800 dark:text-white"
              />
              <Bell size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <button 
            onClick={addHabit}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-200 dark:shadow-none mt-2"
          >
            Create Habit
          </button>
        </div>
      </Modal>

      <Modal isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} title="Set New Goal">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Goal Title</label>
            <input 
              type="text" 
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="e.g. Read Books"
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/30 px-4 py-2.5 border transition-all outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 font-medium text-slate-800 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Amount</label>
              <input 
                type="number" 
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/30 px-4 py-2.5 border transition-all outline-none font-medium text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Unit</label>
              <input 
                type="text" 
                value={newGoalUnit}
                onChange={(e) => setNewGoalUnit(e.target.value)}
                placeholder="e.g. pages"
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/30 px-4 py-2.5 border transition-all outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 font-medium text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-0">
                {['times', 'minutes', 'hours', 'pages', 'tasks', 'sessions', 'km'].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setNewGoalUnit(unit)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                      newGoalUnit === unit
                        ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-200 hover:text-violet-600'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
            </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Frequency</label>
            <div className="relative">
              <select 
                value={newGoalFrequency}
                onChange={(e) => setNewGoalFrequency(e.target.value as Frequency)}
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/30 px-4 py-2.5 border transition-all outline-none appearance-none font-medium text-slate-800 dark:text-white"
              >
                {Object.values(Frequency).map((freq) => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                 <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
          <button 
            onClick={addGoal}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-200 dark:shadow-none mt-2"
          >
            Set Goal
          </button>
        </div>
      </Modal>
    </div>
  );
}