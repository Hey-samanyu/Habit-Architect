
import React from 'react';
import { Check, Trash2, Flame, Zap, Bell } from 'lucide-react';
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
      case Category.HEALTH: return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case Category.WORK: return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
      case Category.LEARNING: return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
      case Category.MINDFULNESS: return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' };
      default: return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' };
    }
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-white rounded-[2rem] border border-dashed border-slate-300">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap size={28} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">The canvas is empty</h3>
        <p className="text-slate-500 max-w-xs mx-auto">Start architecting your routines by adding your first habit.</p>
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
            className={`group bg-white p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between ${
              isCompleted 
                ? 'opacity-60 border-emerald-200' 
                : 'border-slate-200 hover:border-violet-400 hover:shadow-xl'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 min-w-0">
                <button
                  onClick={() => onToggleHabit(habit.id)}
                  className={`flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                      : 'bg-slate-100 text-slate-400 border border-transparent hover:border-violet-300'
                  }`}
                >
                  <Check size={28} strokeWidth={3} className={`transition-transform duration-500 ${isCompleted ? 'scale-100' : 'scale-0'}`} />
                </button>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-black text-lg truncate transition-all ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {habit.title}
                    </h4>
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-tighter">
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
                       <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Bell size={10} /> {habit.reminderTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onDeleteHabit(habit.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-auto">
               <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-4 rounded-full ${i < (habit.streak % 5 || (habit.streak > 0 ? 5 : 0)) ? 'bg-violet-600' : 'bg-slate-100'}`}></div>
                  ))}
               </div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {habit.frequency} Routine
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
