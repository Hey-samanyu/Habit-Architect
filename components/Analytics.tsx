import React, { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Award, Activity, PieChart, BarChart2, TrendingUp, Share2 } from 'lucide-react';
import { Habit, DailyLog, Goal, Category } from '../types';
import { Card } from './UIComponents';

interface AnalyticsProps {
  habits: Habit[];
  goals: Goal[];
  logs: Record<string, DailyLog>;
}

// --- Custom SVG Chart Components ---

const DonutChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativeAngle = 0;

  if (total === 0) {
    return (
      <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-700 mx-auto flex items-center justify-center text-xs text-slate-500 font-medium">
        No Data
      </div>
    );
  }

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          
          const r = 40;
          const cx = 50;
          const cy = 50;
          
          const circumference = 2 * Math.PI * r;
          const dashLength = percentage * circumference;
          const gapLength = circumference - dashLength;
          const offset = -1 * (cumulativeAngle / 360) * circumference;
          
          cumulativeAngle += angle;

          return (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={item.color}
              strokeWidth="12"
              strokeDasharray={`${dashLength} ${gapLength}`}
              strokeDashoffset={offset}
              className="transition-all duration-500 ease-out hover:stroke-width-[14]"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
         <span className="text-2xl font-bold text-slate-800 dark:text-white">{total}</span>
         <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Habits</span>
      </div>
    </div>
  );
};

// --- Main Component ---

export const Analytics: React.FC<AnalyticsProps> = ({ habits, goals, logs }) => {
  
  // 1. Calculate Category Distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    habits.forEach(h => {
      counts[h.category] = (counts[h.category] || 0) + 1;
    });
    
    const colors: Record<string, string> = {
      [Category.HEALTH]: '#10b981', // emerald-500
      [Category.WORK]: '#3b82f6',   // blue-500
      [Category.LEARNING]: '#f59e0b', // amber-500
      [Category.MINDFULNESS]: '#8b5cf6', // violet-500
      [Category.OTHER]: '#64748b',    // slate-500
    };

    return Object.entries(counts).map(([cat, value]) => ({
      label: cat,
      value,
      color: colors[cat] || '#cbd5e1'
    }));
  }, [habits]);

  // 2. Calculate Weekly Data for Bar Chart
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const log = logs[dateKey];
      const completedCount = log?.completedHabitIds.length || 0;
      const totalHabits = habits.length || 1;
      const percentage = Math.round((completedCount / totalHabits) * 100);
      
      return {
        day: format(date, 'EEE'),
        percentage
      };
    });
  }, [logs, habits.length]);

  // Stats
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayLog = logs[todayKey];
  const completedToday = todayLog?.completedHabitIds.length || 0;
  const perfectDays = (Object.values(logs) as DailyLog[]).filter(l => 
    habits.length > 0 && l.completedHabitIds.length === habits.length
  ).length;
  const completedGoals = goals.filter(g => g.current >= g.target).length;

  const handleShareWeekly = () => {
    const avgConsistency = Math.round(weeklyData.reduce((acc, d) => acc + d.percentage, 0) / 7);
    
    let message = `*📊 Weekly Habit Report*\n\n`;
    message += `My Consistency: *${avgConsistency}%* this week!\n\n`;
    
    weeklyData.forEach(d => {
      const bar = '🟦'.repeat(Math.floor(d.percentage / 20)) + '⬜'.repeat(5 - Math.floor(d.percentage / 20));
      message += `${d.day}: ${bar} ${d.percentage}%\n`;
    });
    
    message += `\nTracking with Habit Architect 🚀`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-none shadow-lg shadow-violet-200 dark:shadow-none">
          <div className="flex items-center gap-3 mb-2 opacity-90">
            <Activity size={18} />
            <span className="text-sm font-medium">Today's Focus</span>
          </div>
          <div className="text-3xl font-bold">{completedToday} / {habits.length}</div>
          <div className="text-indigo-100 text-sm mt-1 font-medium">Habits completed</div>
        </Card>

        <Card className="bg-white shadow-sm border-slate-100">
          <div className="flex items-center gap-3 mb-2 text-emerald-600 dark:text-emerald-400">
            <Award size={18} />
            <span className="text-sm font-medium">Perfect Days</span>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">{perfectDays}</div>
          <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Total full completions</div>
        </Card>

        <Card className="bg-white shadow-sm border-slate-100">
          <div className="flex items-center gap-3 mb-2 text-amber-600 dark:text-amber-400">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Goals Crushed</span>
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">{completedGoals}</div>
          <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Out of {goals.length} active</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Bar Chart - Now takes 2 cols */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-violet-600 dark:text-violet-400" />
              Weekly Consistency
            </h3>
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Last 7 Days</span>
                <button 
                    onClick={handleShareWeekly}
                    className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Share Weekly Stats"
                >
                    <Share2 size={16} />
                </button>
            </div>
          </div>
          
          <div className="flex items-end justify-between gap-3 h-40">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                <div className="relative w-full bg-slate-100 dark:bg-slate-700 rounded-t-lg rounded-b-sm overflow-hidden flex items-end group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors h-full">
                   <div 
                      className={`w-full transition-all duration-1000 ease-out absolute bottom-0 ${
                        day.percentage === 100 ? 'bg-emerald-500' : 
                        day.percentage > 50 ? 'bg-violet-600 dark:bg-violet-500' : 'bg-violet-400 dark:bg-violet-700'
                      }`}
                      style={{ height: `${day.percentage}%` }}
                   />
                   {/* Tooltip */}
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1.5 px-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 scale-90 group-hover:scale-100 origin-bottom font-bold">
                     {day.percentage}% Done
                     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                   </div>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Distribution (Takes 1 col) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <PieChart size={18} className="text-violet-600 dark:text-violet-400" />
               Focus Areas
             </h3>
          </div>
          <DonutChart data={categoryData} />
          <div className="mt-6 space-y-2">
            {categoryData.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};