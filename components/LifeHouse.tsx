
import React, { useMemo } from 'react';
import { Habit, DailyLog } from '../types';
import { format, subDays } from 'date-fns';
import { Construction, Trees, House, Shovel, Info } from 'lucide-react';
// Fix: Import Card component from UIComponents
import { Card } from './UIComponents';

interface LifeHouseProps {
  habits: Habit[];
  logs: Record<string, DailyLog>;
}

export const LifeHouse: React.FC<LifeHouseProps> = ({ habits, logs }) => {
  const stats = useMemo(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    const todayLog = logs[todayKey];
    const yesterdayLog = logs[yesterdayKey];
    
    const todayProgress = habits.length > 0 
      ? (todayLog?.completedHabitIds.length || 0) / habits.length 
      : 0;
      
    const totalCompletions = Object.values(logs).reduce((acc, log) => acc + log.completedHabitIds.length, 0);
    const avgStreak = habits.length > 0 
      ? habits.reduce((acc, h) => acc + h.streak, 0) / habits.length 
      : 0;

    // Construction stage (0 to 5)
    // 0: Ground/Foundation
    // 1: First floor walls
    // 2: Second floor / Full walls
    // 3: Roof
    // 4: Windows & Details
    // 5: Finished Estate
    const stage = Math.min(5, Math.floor(totalCompletions / 10)); // Every 10 completions moves the build forward
    
    const hasWeeds = yesterdayLog && yesterdayLog.completedHabitIds.length === 0;
    const isUnderConstruction = todayProgress < 1;

    return { stage, todayProgress, avgStreak, hasWeeds, isUnderConstruction };
  }, [habits, logs]);

  const renderHouse = () => {
    const { stage, todayProgress, hasWeeds, isUnderConstruction } = stats;

    return (
      <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
        {/* Sky / Background context */}
        <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/20 rounded-[3rem] -z-10 border border-slate-200/50 dark:border-slate-800/50"></div>
        
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
          {/* Ground */}
          <rect x="50" y="320" width="300" height="40" rx="10" className="fill-slate-200 dark:fill-slate-800" />
          
          {/* Stage 0: Foundation */}
          {stage >= 0 && (
            <rect x="80" y="300" width="240" height="20" className="fill-slate-400 dark:fill-slate-700 transition-all duration-1000" />
          )}

          {/* Stage 1: Lower Walls */}
          {stage >= 1 && (
            <rect x="90" y="220" width="220" height="80" className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700 stroke-2 transition-all duration-1000" />
          )}

          {/* Stage 2: Upper Structure */}
          {stage >= 2 && (
            <rect x="110" y="160" width="180" height="60" className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700 stroke-2 transition-all duration-1000" />
          )}

          {/* Stage 3: Roof */}
          {stage >= 3 && (
            <path d="M80 220 L200 120 L320 220 Z" className="fill-slate-800 dark:fill-slate-950 transition-all duration-1000" />
          )}

          {/* Stage 4: Windows & Door */}
          {stage >= 4 && (
            <>
              {/* Door */}
              <rect x="180" y="260" width="40" height="40" className="fill-slate-100 dark:fill-slate-900 stroke-slate-400 dark:stroke-slate-600 stroke-1" />
              <circle cx="212" cy="280" r="2" className="fill-slate-400" />
              {/* Windows */}
              <rect x="120" y="240" width="30" height="30" className="fill-emerald-50 dark:fill-emerald-900/20 stroke-emerald-200 dark:stroke-emerald-800" />
              <rect x="250" y="240" width="30" height="30" className="fill-emerald-50 dark:fill-emerald-900/20 stroke-emerald-200 dark:stroke-emerald-800" />
              <rect x="185" y="180" width="30" height="30" className="fill-emerald-50 dark:fill-emerald-900/20 stroke-emerald-200 dark:stroke-emerald-800" />
            </>
          )}

          {/* Stage 5: Garden / Trees */}
          {stage >= 5 && (
            <>
              <circle cx="70" cy="290" r="25" className="fill-emerald-500/20" />
              <rect x="65" y="290" width="10" height="30" className="fill-slate-400" />
              <circle cx="330" cy="290" r="20" className="fill-emerald-500/20" />
              <rect x="325" y="290" width="10" height="30" className="fill-slate-400" />
            </>
          )}

          {/* Scaffolding (Visible if today's work isn't done) */}
          {isUnderConstruction && (
            <g className="opacity-40 stroke-slate-400 stroke-1 fill-none">
              <rect x="85" y="150" width="230" height="150" />
              <line x1="85" y1="200" x2="315" y2="200" />
              <line x1="85" y1="250" x2="315" y2="250" />
              <line x1="150" y1="150" x2="150" y2="300" />
              <line x1="250" y1="150" x2="250" y2="300" />
            </g>
          )}

          {/* Weeds (Visible if yesterday was a zero day) */}
          {hasWeeds && (
            <g className="fill-amber-700/30">
              <path d="M60 320 Q 70 300 80 320" />
              <path d="M320 320 Q 330 300 340 320" />
              <path d="M200 320 Q 210 310 220 320" />
            </g>
          )}
        </svg>

        {/* Progress Overlay */}
        <div className="absolute bottom-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Integrity</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${todayProgress * 100}%` }}
                />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">{Math.round(todayProgress * 100)}%</span>
            </div>
          </div>
          {isUnderConstruction && (
            <div className="flex items-center gap-1.5 text-amber-500">
              <Construction size={16} className="animate-pulse" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Life House</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md">Your habits are the bricks. Your consistency is the mortar. Build a structure that lasts.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Construction Stage</span>
             <span className="text-xl font-black text-slate-900 dark:text-white">{stats.stage} / 5</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural Health</span>
             <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">Solid</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center py-12">
        {renderHouse()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-start gap-4">
           <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
              <Shovel size={24} />
           </div>
           <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm mb-1">Add Bricks</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Every 10 habit completions across your entire history adds a new layer to your home.</p>
           </div>
        </Card>
        <Card className="flex items-start gap-4">
           <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
              <Trees size={24} />
           </div>
           <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm mb-1">Landscape</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Reach Stage 5 to unlock the lush green landscape. Consistency keeps the garden clean.</p>
           </div>
        </Card>
        <Card className="flex items-start gap-4">
           <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
              <Info size={24} />
           </div>
           <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm mb-1">Blueprint Integrity</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">If you haven't finished your habits today, you'll see scaffolding. This means your house isn't yet ready for the night.</p>
           </div>
        </Card>
      </div>
    </div>
  );
};
