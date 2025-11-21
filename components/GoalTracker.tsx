import React from 'react';
import { Plus, Minus, Trash2, Trophy, Target, Repeat, Calendar, Share2 } from 'lucide-react';
import { Goal, Frequency } from '../types';
import { ProgressBar } from './UIComponents';

interface GoalTrackerProps {
  goals: Goal[];
  onUpdateProgress: (id: string, delta: number) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ goals, onUpdateProgress, onDeleteGoal }) => {
  
  if (goals.length === 0) {
     return (
      <div className="text-center py-12 px-4 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
         <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Target size={20} className="text-slate-400" />
        </div>
        <h3 className="font-medium text-slate-800 mb-1">No active goals</h3>
        <p className="text-sm text-slate-500">Set a target to track your progress.</p>
      </div>
    );
  }

  const getFrequencyLabel = (freq: Frequency) => {
      switch(freq) {
          case Frequency.DAILY: return { label: 'Daily', icon: Repeat };
          case Frequency.WEEKLY: return { label: 'Weekly', icon: Calendar };
          case Frequency.MONTHLY: return { label: 'Monthly', icon: Calendar };
          default: return { label: 'One-time', icon: Target };
      }
  }

  const handleShareGoal = (goal: Goal, percent: number) => {
      const isCompleted = goal.current >= goal.target;
      let message = "";
      
      if (isCompleted) {
          message = `🎉 *Goal Smashed!* I just completed my goal: *${goal.title}*! (${goal.target} ${goal.unit})\n\nTracking with HabitFlow 🚀`;
      } else {
          message = `🚀 *Goal Update:* I'm ${percent}% of the way to my goal: *${goal.title}*.\nProgress: ${goal.current}/${goal.target} ${goal.unit}.\n\nTracking with HabitFlow ⚡`;
      }
      
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {goals.map((goal) => {
        const isCompleted = goal.current >= goal.target;
        const percent = Math.min(100, Math.floor((goal.current / goal.target) * 100));
        
        // Fallback for goals created before frequency was added
        const frequency = goal.frequency || Frequency.ONCE; 
        const { label: freqLabel, icon: FreqIcon } = getFrequencyLabel(frequency);

        return (
          <div key={goal.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm relative group hover:shadow-md transition-all duration-300">
             <button 
              onClick={() => onDeleteGoal(goal.id)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1 hover:bg-rose-50 rounded z-10"
            >
              <Trash2 size={14} />
            </button>

            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isCompleted ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Trophy size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-slate-900 text-sm">{goal.title}</h4>
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            <FreqIcon size={10} /> {freqLabel}
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {goal.target} {goal.unit} target
                    </p>
                  </div>
               </div>
               <div className="text-right mt-1 mr-6">
                  <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleShareGoal(goal, percent)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors"
                        title="Share Progress"
                      >
                        <Share2 size={14} />
                      </button>
                      <span className={`text-lg font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {percent}%
                      </span>
                  </div>
               </div>
            </div>

            <div className="mb-4">
               <ProgressBar 
                  current={goal.current} 
                  max={goal.target} 
                  colorClass={isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'} 
               />
               <div className="flex justify-between text-xs text-slate-500 mt-2 font-semibold">
                  <span>0</span>
                  <span>{goal.current} / {goal.target} {goal.unit}</span>
               </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onUpdateProgress(goal.id, -1)}
                disabled={isCompleted || goal.current <= 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors border border-slate-200"
              >
                <Minus size={14} />
              </button>
              <button 
                onClick={() => onUpdateProgress(goal.id, 1)}
                disabled={isCompleted}
                className={`flex-1 h-8 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
                  isCompleted 
                    ? 'bg-emerald-50 text-emerald-700 cursor-default' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200'
                }`}
              >
                {isCompleted ? (
                    <>Goal Reached!</>
                ) : (
                    <>Log Progress</>
                )}
              </button>
               <button 
                onClick={() => onUpdateProgress(goal.id, 1)}
                disabled={isCompleted}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors border border-slate-200"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};