
import React from 'react';
import { Check, Trash2, Flame, Zap, Bell, Plus } from 'lucide-react';
import { Habit, Category } from '../types';

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
      case Category.HEALTH: return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-400/10', border: 'border-emerald-100 dark:border-emerald-400/20' };
      case Category.WORK: return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10', border: 'border-blue-100 dark:border-blue-400/20' };
      case Category.LEARNING: return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-400/10', border: 'border-amber-100 dark:border-amber-400/20' };
      case Category.MINDFULNESS: return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-400/10', border: 'border-purple-100 dark:border-purple-400/20' };
      default: return { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-400/10', border: 'border-slate-100 dark:border-slate-400/20' };
    }
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap size={28} className="text-slate-400 dark:text-slate-600" />
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
            className={`group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between ${
              isCompleted 
                ? 'opacity-60 border-emerald-200 dark:border-emerald-500/40' 
                : 'border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-xl dark:hover:shadow-none'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 min-w-0">
                <button
                  onClick={() => onToggleHabit(habit.id)}
                  aria-label={isCompleted ? "Mark habit as incomplete" : "Mark habit as complete"}
                  className={`flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 relative group/btn ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-200 dark:shadow-none'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-violet-400 dark:hover:border-violet-500'
                  }`}
                >
                  {/* The visible checkmark when completed */}
                  <Check 
                    size={28} 
                    strokeWidth={4} 
                    className={`transition-all duration-500 ${isCompleted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} 
                  />
                  
                  {/* The "ghost" checkmark on hover when uncompleted */}
                  {!isCompleted && (
                    <Check 
                      size={28} 
                      strokeWidth={4} 
                      className="absolute opacity-0 group-hover/btn:opacity-20 transition-opacity text-violet-600 dark:text-violet-400" 
                    />
                  )}

                  {/* Accessible "indicator" for empty state if needed, but the border usually suffices */}
                </button>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-black text-lg truncate transition-all ${isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {habit.title}
                    </h4>
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-tighter">
                        <Flame size={10} fill="currentColor" />
                        {habit.streak}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${theme.bg} ${theme.color} border ${theme.border}`}>
                      {theme.color ? habit.category : Category.OTHER}
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
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-auto">
               <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-4 rounded-full ${i < (habit.streak % 5 || (habit.streak > 0 ? 5 : 0)) ? 'bg-violet-600 dark:bg-violet-500' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                  ))}
               </div>
               <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {habit.frequency} Routine
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
