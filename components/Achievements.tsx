
import React from 'react';
import { Trophy, Flame, Target, Zap, Crown, Star, Lock, CheckCircle2, Rocket, Shield } from 'lucide-react';
import { Badge } from '../types';

export const BADGES_LIST: Badge[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Created your first habit',
    icon: 'Star',
    color: 'from-blue-400 to-blue-600',
    condition: 'Create 1 habit'
  },
  {
    id: 'streak_3',
    title: 'Momentum',
    description: 'Reached a 3-day streak',
    icon: 'Zap',
    color: 'from-amber-400 to-amber-600',
    condition: '3 day streak'
  },
  {
    id: 'streak_7',
    title: 'On Fire',
    description: 'Reached a 7-day streak',
    icon: 'Flame',
    color: 'from-orange-400 to-orange-600',
    condition: '7 day streak'
  },
  {
    id: 'streak_30',
    title: 'Habit Master',
    description: 'Reached a 30-day streak',
    icon: 'Crown',
    color: 'from-purple-400 to-purple-600',
    condition: '30 day streak'
  },
  {
    id: 'goal_getter',
    title: 'Goal Getter',
    description: 'Completed your first goal',
    icon: 'Target',
    color: 'from-emerald-400 to-emerald-600',
    condition: 'Complete 1 goal'
  },
  {
    id: 'consistent',
    title: 'Consistent',
    description: 'Completed 50 total habits',
    icon: 'CheckCircle2',
    color: 'from-indigo-400 to-indigo-600',
    condition: '50 total logs'
  },
  {
    id: 'architect',
    title: 'The Architect',
    description: 'Have 5 active habits',
    icon: 'Shield',
    color: 'from-rose-400 to-rose-600',
    condition: '5 active habits'
  },
  {
    id: 'high_flyer',
    title: 'High Flyer',
    description: 'Hit 100% completion today',
    icon: 'Rocket',
    color: 'from-pink-400 to-pink-600',
    condition: 'Complete all daily habits'
  }
];

interface AchievementsProps {
  earnedBadgeIds: string[];
}

export const Achievements: React.FC<AchievementsProps> = ({ earnedBadgeIds }) => {
  
  const getIcon = (name: string, size: number) => {
    switch(name) {
      case 'Star': return <Star size={size} fill="currentColor" />;
      case 'Zap': return <Zap size={size} fill="currentColor" />;
      case 'Flame': return <Flame size={size} fill="currentColor" />;
      case 'Crown': return <Crown size={size} fill="currentColor" />;
      case 'Target': return <Target size={size} />;
      case 'CheckCircle2': return <CheckCircle2 size={size} />;
      case 'Shield': return <Shield size={size} fill="currentColor" />;
      case 'Rocket': return <Rocket size={size} fill="currentColor" />;
      default: return <Trophy size={size} />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {BADGES_LIST.map((badge) => {
        const isUnlocked = earnedBadgeIds.includes(badge.id);
        
        return (
          <div 
            key={badge.id}
            className={`relative group h-[300px] rounded-[2.5rem] flex flex-col items-center justify-start p-8 text-center transition-all duration-700 border ${
              isUnlocked 
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl scale-100 hover:-translate-y-2' 
                : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50 opacity-40 grayscale pointer-events-none'
            }`}
          >
            {/* Background Accent glow for unlocked */}
            {isUnlocked && (
              <div className={`absolute inset-0 blur-[60px] opacity-10 rounded-full bg-gradient-to-tr ${badge.color} transition-opacity group-hover:opacity-20`}></div>
            )}

            {/* Icon Container */}
            <div className={`relative z-10 w-20 h-20 rounded-3xl mb-6 flex items-center justify-center transition-all duration-700 shadow-2xl ${
              isUnlocked 
                ? `bg-gradient-to-br ${badge.color} text-white ring-8 ring-slate-50 dark:ring-slate-800 group-hover:rotate-6 group-hover:scale-110` 
                : 'bg-slate-200/50 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
            }`}>
              {isUnlocked ? getIcon(badge.icon, 32) : <Lock size={28} />}
            </div>
            
            {/* Text Content */}
            <div className="relative z-10 space-y-3">
              <h4 className={`text-2xl font-black leading-tight tracking-tight uppercase ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-600'}`}>
                {badge.title}
              </h4>
              <p className={`text-xs font-bold leading-relaxed px-4 ${isUnlocked ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-700'}`}>
                {badge.description}
              </p>
            </div>

            {/* Footer Status */}
            <div className="mt-auto relative z-10">
                {isUnlocked ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} strokeWidth={3} /> Unlocked
                    </div>
                ) : (
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-700">
                        Locked
                    </div>
                )}
            </div>
            
            {/* Subtle Progress Bar Placeholder for locked items */}
            {!isUnlocked && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-200 dark:bg-slate-700 w-1/4"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
