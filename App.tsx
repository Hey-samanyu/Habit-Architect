import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, Layout, BarChart3, CheckCircle2, Target, Menu, X, Home, ListChecks, PieChart, Activity, RotateCcw, Bell, LogOut, Medal, PartyPopper } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { supabase } from './services/supabaseClient';

import { Habit, Goal, Category, AppState, Frequency, DailyLog, User, Badge } from './types';
import { AuthScreen } from './components/AuthScreen';
import { HabitTracker } from './components/HabitTracker';
import { GoalTracker } from './components/GoalTracker';
import { AIOverview } from './components/AIOverview';
import { Analytics } from './components/Analytics';
import { KairoChat } from './components/KairoChat';
import { Achievements, BADGES_LIST } from './components/Achievements';
import { Modal, Card } from './components/UIComponents';

// Helper to get today's date string YYYY-MM-DD
const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

const generateFakeData = (): AppState => {
  const today = new Date();
  
  const habits: Habit[] = [
    { 
      id: 'h1', 
      title: 'Morning Meditation', 
      category: Category.MINDFULNESS, 
      createdAt: subDays(today, 30).toISOString(), 
      streak: 24,
      frequency: Frequency.DAILY,
      reminderTime: "07:00"
    },
    { 
      id: 'h2', 
      title: 'Deep Work (4h)', 
      category: Category.WORK, 
      createdAt: subDays(today, 14).toISOString(), 
      streak: 8,
      frequency: Frequency.DAILY
    },
    { 
      id: 'h3', 
      title: 'No Sugar', 
      category: Category.HEALTH, 
      createdAt: subDays(today, 15).toISOString(), 
      streak: 12,
      frequency: Frequency.DAILY
    }
  ];

  const goals: Goal[] = [
    { 
      id: 'g1', 
      title: 'Run 50km', 
      current: 35, 
      target: 50, 
      unit: 'km', 
      frequency: Frequency.MONTHLY 
    }
  ];

  const logs: Record<string, DailyLog> = {};
  
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    logs[dateKey] = {
      date: dateKey,
      completedHabitIds: i % 2 === 0 ? ['h1', 'h2'] : ['h1'],
      goalProgress: {}
    };
  }

  // Initial earned badges for fake data
  const earnedBadges = ['first_step', 'streak_3', 'streak_7'];

  return { habits, goals, logs, earnedBadges };
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>({ habits: [], goals: [], logs: {}, earnedBadges: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // --- Authentication & Data Loading (Supabase) ---
  
  useEffect(() => {
    const client = supabase;
    if (!client) {
        setIsLoaded(true);
        return;
    }

    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.full_name || session.user.email!,
          };
          setUser(userData);
          await loadUserData(session.user.id);
        } else {
          setUser(null);
          setState({ habits: [], goals: [], logs: {}, earnedBadges: [] });
          setIsLoaded(true);
        }
      }
    );

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
             // Merge with defaults to ensure new fields exist
             const loadedState = data.content as AppState;
             if (!loadedState.earnedBadges) loadedState.earnedBadges = [];
             setState(loadedState);
        } else {
            // First time user, insert empty or default state
             console.log("No data found, starting fresh.");
        }
    } catch (err) {
        console.error("Error loading data:", err);
    } finally {
        setIsLoaded(true);
    }
  };

  // Debounced Save Data to Supabase
  useEffect(() => {
    const client = supabase;
    if (!isLoaded || !user || !client) return;

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

    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [state, isLoaded, user]);

  const handleSignOut = async () => {
      const client = supabase;
      if (client) await client.auth.signOut();
  };


  // --- UI State ---
  const [isHabitModalOpen, setHabitModalOpen] = useState(false);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [currentHabitTab, setCurrentHabitTab] = useState<Frequency>(Frequency.DAILY);
  const [isSidebarOpen, setSidebarOpen] = useState(false); 
  const [activeSection, setActiveSection] = useState('dashboard');
  const [newBadge, setNewBadge] = useState<Badge | null>(null); // For badge modal
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

  // --- Achievement Engine ---
  const checkAchievements = (newState: AppState) => {
      const earned = new Set(newState.earnedBadges);
      const newBadges: string[] = [];
      const todayKey = getTodayKey();

      // 1. First Step: Created a habit
      if (newState.habits.length >= 1 && !earned.has('first_step')) newBadges.push('first_step');

      // 2. Streaks
      const maxStreak = Math.max(...newState.habits.map(h => h.streak), 0);
      if (maxStreak >= 3 && !earned.has('streak_3')) newBadges.push('streak_3');
      if (maxStreak >= 7 && !earned.has('streak_7')) newBadges.push('streak_7');
      if (maxStreak >= 30 && !earned.has('streak_30')) newBadges.push('streak_30');

      // 3. Architect: 5 Active Habits
      if (newState.habits.length >= 5 && !earned.has('architect')) newBadges.push('architect');

      // 4. Goal Getter: Completed a goal
      const completedGoals = newState.goals.filter(g => g.current >= g.target).length;
      if (completedGoals >= 1 && !earned.has('goal_getter')) newBadges.push('goal_getter');

      // 5. Consistent: 50 Total Completions
      const totalCompletions = Object.values(newState.logs).reduce((acc, log) => acc + log.completedHabitIds.length, 0);
      if (totalCompletions >= 50 && !earned.has('consistent')) newBadges.push('consistent');

      // 6. High Flyer: 100% Today
      const todayLog = newState.logs[todayKey];
      const todayCompleted = todayLog ? todayLog.completedHabitIds.length : 0;
      const activeHabits = newState.habits.length;
      if (activeHabits > 0 && todayCompleted === activeHabits && !earned.has('high_flyer')) newBadges.push('high_flyer');

      if (newBadges.length > 0) {
          const updatedEarnedBadges = [...newState.earnedBadges, ...newBadges];
          
          // Trigger modal for the first new badge found
          const badgeDef = BADGES_LIST.find(b => b.id === newBadges[0]);
          if (badgeDef) setNewBadge(badgeDef);

          return { ...newState, earnedBadges: updatedEarnedBadges };
      }

      return newState;
  };

  // Notifications
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

  // Scroll Spy
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const observerOptions = {
      root: main,
      threshold: 0.2,
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

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  // --- Auth Guard ---
  if (!user) {
      return <AuthScreen onAuthSuccess={() => {}} />;
  }

  const todayKey = getTodayKey();
  const todayLog = state.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // --- Actions ---
  const resetData = () => {
      if(confirm("This will REPLACE your current data with sample data. Are you sure?")) {
          setState(generateFakeData());
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
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-900/20">
              <Layout className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Habit<span className="text-indigo-400">Architect</span>
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400">
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
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800 space-y-2">
              <div className="px-4 pb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${saveStatus === 'error' ? 'border-rose-800 text-rose-400 bg-rose-950/30' : 'border-emerald-800 text-emerald-400 bg-emerald-950/30'}`}>
                    {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'error' ? 'Sync Error' : 'Cloud Synced'}
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
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 z-10 shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600">
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <Calendar size={14} />
                    <span>{format(new Date(), 'EEEE, MMM do')}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <span className="hidden md:inline">{user.name}</span>
                    <div className="w-8 h-8 bg-indigo-100 rounded-full border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
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
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{getGreeting()}, {user.name.split(' ')[0]}</h2>
                        <p className="text-slate-500 mt-1">Here's what's happening with your goals today.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={openHabitModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm">
                            <Plus size={18} /> Add Habit
                        </button>
                        <button onClick={() => setGoalModalOpen(true)} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-sm">
                            <Target size={18} /> Add Goal
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <Card className="p-5 flex items-center gap-5 border-l-4 border-l-emerald-500">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Daily Completion</p>
                            <p className="text-2xl font-extrabold text-slate-800">{percentage}%</p>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-5 border-l-4 border-l-indigo-500">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                             <BarChart3 size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Habits</p>
                            <p className="text-2xl font-extrabold text-slate-800">{state.habits.length}</p>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-5 border-l-4 border-l-amber-500">
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Goals</p>
                            <p className="text-2xl font-extrabold text-slate-800">{state.goals.length}</p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        <AIOverview habits={state.habits} goals={state.goals} logs={state.logs} />

                        <section id="habits" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 scroll-mt-20">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <ListChecks className="text-indigo-600" size={20} />
                                        Your Checklist
                                    </h3>
                                    <p className="text-sm text-slate-500">Manage your daily tasks</p>
                                </div>
                                <div className="flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                                    {[Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setCurrentHabitTab(tab)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        currentHabitTab === tab 
                                        ? 'bg-white text-slate-800 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
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
                            <Analytics habits={state.habits} goals={state.goals} logs={state.logs} />
                        </section>

                        <section id="achievements" className="scroll-mt-20">
                             <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Medal className="text-amber-500" size={20} />
                                        Achievements
                                    </h3>
                                    <p className="text-sm text-slate-500">Badges you've unlocked</p>
                                </div>
                            </div>
                            <Achievements earnedBadgeIds={state.earnedBadges} />
                        </section>
                    </div>

                    <div className="space-y-8">
                         <section id="goals" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 scroll-mt-20">
                             <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Target className="text-indigo-600" size={20} />
                                        Active Goals
                                    </h3>
                                    <p className="text-sm text-slate-500">Track your milestones</p>
                                </div>
                            </div>
                            <GoalTracker 
                                goals={state.goals} 
                                onUpdateProgress={updateGoalProgress}
                                onDeleteGoal={deleteGoal}
                            />
                        </section>
                        
                         <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                             <div className="relative z-10">
                                 <h4 className="font-bold text-lg mb-2">Keep it up! 🚀</h4>
                                 <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                                     Consistency is key. You're doing great. Check back in tomorrow to keep your streak alive.
                                 </p>
                                 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-200">
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

      <KairoChat habits={state.habits} goals={state.goals} logs={state.logs} />

      {/* Badge Unlock Modal */}
      {newBadge && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center relative overflow-hidden animate-in zoom-in duration-300">
                <button 
                    onClick={() => setNewBadge(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={24} />
                </button>
                
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-transparent -z-10"></div>

                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce ${newBadge.color} text-white`}>
                    <Medal size={48} />
                </div>

                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Badge Unlocked!</h2>
                <h3 className="text-xl font-bold text-indigo-600 mb-2">{newBadge.title}</h3>
                <p className="text-slate-500 font-medium mb-6">{newBadge.description}</p>

                <button 
                    onClick={() => setNewBadge(null)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    Awesome!
                </button>
            </div>
        </div>
      )}

      <Modal isOpen={isHabitModalOpen} onClose={() => setHabitModalOpen(false)} title="Create New Habit">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Habit Name</label>
            <input 
              type="text" 
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="e.g. Morning Meditation"
              className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-2.5 border transition-all outline-none placeholder:text-slate-500 font-medium text-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Category</label>
              <div className="relative">
                <select 
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value as Category)}
                  className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-2.5 border transition-all outline-none appearance-none bg-white font-medium text-slate-800"
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
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Frequency</label>
              <div className="relative">
                <select 
                  value={newHabitFrequency}
                  onChange={(e) => setNewHabitFrequency(e.target.value as Frequency)}
                  className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-2.5 border transition-all outline-none appearance-none bg-white font-medium text-slate-800"
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
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Daily Reminder (Optional)</label>
            <div className="relative">
              <input 
                type="time"
                value={newHabitReminder}
                onChange={(e) => setNewHabitReminder(e.target.value)}
                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-2.5 border transition-all outline-none bg-white font-medium text-slate-800"
              />
              <Bell size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <button 
            onClick={addHabit}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 mt-2"
          >
            Create Habit
          </button>
        </div>
      </Modal>

      <Modal isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} title="Set New Goal">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Goal Title</label>
            <input 
              type="text" 
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="e.g. Read Books"
              className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-2.5 border transition-all outline-none placeholder:text-slate-500 font-medium text-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Target Amount</label>
              <input 
                type="number" 
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-2.5 border transition-all outline-none font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Unit</label>
              <input 
                type="text" 
                value={newGoalUnit}
                onChange={(e) => setNewGoalUnit(e.target.value)}
                placeholder="e.g. pages"
                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-2.5 border transition-all outline-none placeholder:text-slate-500 font-medium text-slate-800"
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
                        ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
            </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Frequency</label>
            <div className="relative">
              <select 
                value={newGoalFrequency}
                onChange={(e) => setNewGoalFrequency(e.target.value as Frequency)}
                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-2.5 border transition-all outline-none appearance-none bg-white font-medium text-slate-800"
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 mt-2"
          >
            Set Goal
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default App;