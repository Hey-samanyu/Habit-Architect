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
  
  const getCategoryColor = (cat: Category) => {
    switch(cat) {
      case Category.HEALTH: return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case Category.WORK: return 'text-blue-700 bg-blue-50 border-blue-200';
      case Category.LEARNING: return 'text-amber-700 bg-amber-50 border-amber-200';
      case Category.MINDFULNESS: return 'text-purple-700 bg-purple-50 border-purple-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-12 px-4 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Zap size={20} className="text-slate-400" />
        </div>
        <h3 className="font-medium text-slate-800 mb-1">No habits found</h3>
        <p className="text-sm text-slate-500">Select a tab or add a new habit to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {habits.map((habit) => {
        const isCompleted = completedHabitIds.includes(habit.id);
        const isDaily = habit.frequency === Frequency.DAILY;
        
        // Logic for Milestone Flourish
        const isMilestone = isDaily && isCompleted && (habit.streak % 7 === 0 || habit.streak === 30 || habit.streak === 100) && habit.streak > 0;

        // Determine streak styling based on tiered system
        let streakConfig = {
          color: "text-slate-600 bg-slate-100 border-slate-200",
          Icon: TrendingUp,
          animation: "",
          label: "Streak"
        };
        
        if (habit.streak >= 30) {
          streakConfig = {
            color: "text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 border-violet-200 shadow-md shadow-violet-200",
            Icon: Crown,
            animation: "",
            label: "Mastery"
          };
        } else if (habit.streak >= 14) {
          streakConfig = {
            color: "text-white bg-gradient-to-r from-fuchsia-500 to-pink-600 border-fuchsia-200 shadow-md shadow-fuchsia-200",
            Icon: Trophy,
            animation: "animate-bounce",
            label: "Elite"
          };
        } else if (habit.streak >= 7) {
          streakConfig = {
            color: "text-white bg-gradient-to-r from-orange-500 to-amber-500 border-orange-200 shadow-md shadow-orange-200",
            Icon: Flame,
            animation: "animate-pulse",
            label: "On Fire"
          };
        } else if (habit.streak >= 3) {
          streakConfig = {
            color: "text-amber-800 bg-amber-100 border-amber-200",
            Icon: Zap,
            animation: "",
            label: "Building"
          };
        } else if (habit.streak > 0) {
           streakConfig = {
            color: "text-blue-700 bg-blue-50 border-blue-200",
            Icon: Sparkles,
            animation: "",
            label: "Start"
          };
        }

        // Override icon for the specific moment of a milestone
        if (isMilestone) {
            streakConfig.Icon = PartyPopper;
            streakConfig.color = "text-yellow-900 bg-yellow-100 border-yellow-300 shadow-sm ring-2 ring-yellow-200 ring-offset-1";
            streakConfig.animation = "animate-bounce";
            streakConfig.label = "Milestone!";
        }

        return (
          <div 
            key={habit.id}
            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 ${
              isCompleted 
                ? 'bg-slate-50/80 border-transparent shadow-none' 
                : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center gap-4 overflow-hidden flex-1">
              <button
                onClick={() => onToggleHabit(habit.id)}
                className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${
                  isCompleted
                    ? 'bg-indigo-600 border-indigo-600 text-white rotate-0 shadow-md shadow-indigo-200 scale-100'
                    : 'border-slate-300 text-transparent hover:border-indigo-500 -rotate-6 hover:rotate-0 hover:bg-indigo-50 hover:scale-110'
                }`}
              >
                <Check size={24} strokeWidth={4} className={isCompleted ? 'animate-in zoom-in duration-300' : ''} />
              </button>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                   <h4 className={`font-bold truncate transition-all text-lg ${isCompleted ? 'text-slate-500 line-through decoration-slate-300 decoration-2' : 'text-slate-900'}`}>
                    {habit.title}
                  </h4>
                  {habit.reminderTime && !isCompleted && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      <Bell size={10} className="text-indigo-400" />
                      {habit.reminderTime}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                   <span className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-md border uppercase ${getCategoryColor(habit.category)}`}>
                    {habit.category}
                  </span>
                  
                  {/* Only show streaks for Daily habits */}
                  {isDaily && habit.streak > 0 && (
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all duration-500 ${streakConfig.color}`}>
                      <streakConfig.Icon size={12} className={streakConfig.animation} fill={habit.streak >= 7 ? "currentColor" : "none"} /> 
                      <span>{habit.streak} Days</span>
                    </span>
                  )}

                  {/* For non-daily habits, show frequency badge */}
                  {!isDaily && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border text-slate-600 bg-slate-100 border-slate-200">
                        {habit.frequency === Frequency.WEEKLY ? <Calendar size={12} /> : <Clock size={12} />}
                        {habit.frequency}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => onDeleteHabit(habit.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all ml-2"
              title="Delete habit"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
};