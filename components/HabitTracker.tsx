
import React from 'react';
import { Check, Trash2, Flame, Zap, Trophy, TrendingUp, PartyPopper, Calendar, Clock, Crown, Sparkles, Bell } from 'lucide-react';
import { Habit, Category, Frequency } from '../types';

interface HabitTrackerProps {
  habits: Habit[];
  completedHabitIds: string[];
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ 
  habits, 
  completedHabitIds, 
  onToggleHabit,
  onDeleteHabit
}) => {
  
  const getCategoryTheme = (cat: Category) => {
    switch(cat) {
      case Category.HEALTH: return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
      case Category.WORK: return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      case Category.LEARNING: return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
      case Category.MINDFULNESS: return { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
      default: return { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
    }
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-20 px-4 glass-card rounded-[2rem] border-dashed">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Zap size={28} className="text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">The canvas is empty</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Start architecting your routines by adding your first habit.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {habits.map((habit, index) => {
        const isCompleted = completedHabitIds.includes(habit.id);
        const theme = getCategoryTheme(habit.category);
        
        return (
          <div 
            key={habit.id}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`group glass-card p-5 rounded-[1.75rem] transition-all duration-500 flex flex-col justify-between animate-in slide-in-from-bottom-4 fade-in ${
              isCompleted 
                ? 'opacity-80 scale-[0.98] border-emerald-500/20' 
                : 'hover:border-violet-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 min-w-0">
                <button
                  onClick={() => onToggleHabit(habit.id)}
                  className={`relative flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 overflow-hidden ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-0'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-violet-500 border border-transparent hover:border-violet-500/50 -rotate-3 hover:rotate-0'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/20 to-transparent transition-opacity ${isCompleted ? 'opacity-100' : 'opacity-0'}`}></div>
                  <Check size={28} strokeWidth={3} className={`relative z-10 transition-transform duration-500 ${isCompleted ? 'scale-100' : 'scale-0'}`} />
                  {!isCompleted && <div className="absolute inset-0 flex items-center justify-center font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">DONE?</div>}
                </button>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-extrabold text-lg truncate transition-all ${isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {habit.title}
                    </h4>
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-tighter">
                        <Flame size={10} fill="currentColor" />
                        {habit.streak}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${theme.bg} ${theme.color} border ${theme.border}`}>
                      {habit.category}
                    </span>
                    {habit.reminderTime && (
                       <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Bell size={10} /> {habit.reminderTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onDeleteHabit(habit.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-auto">
               <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-6 rounded-full border border-white dark:border-slate-900 ${i < (habit.streak % 5 || 5) && habit.streak > 0 ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                  ))}
               </div>
               <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {habit.frequency} Routine
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
