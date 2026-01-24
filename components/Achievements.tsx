
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
    <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar">
      {BADGES_LIST.map((badge) => {
        const isUnlocked = earnedBadgeIds.includes(badge.id);
        
        return (
          <div 
            key={badge.id}
            className={`flex-shrink-0 w-[160px] h-[340px] relative rounded-[2rem] flex flex-col items-center justify-start p-6 text-center transition-all duration-500 group ${
              isUnlocked 
                ? 'bg-slate-900/40 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl scale-100' 
                : 'bg-slate-100/30 dark:bg-slate-900/30 border border-slate-200/20 dark:border-slate-800/20 opacity-40'
            }`}
          >
            {/* Top Shine Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[2rem] pointer-events-none"></div>

            {/* Icon Container */}
            <div className={`relative z-10 w-16 h-16 rounded-2xl mb-8 flex items-center justify-center transition-all duration-700 shadow-xl ${
              isUnlocked 
                ? `bg-gradient-to-br ${badge.color} text-white ring-4 ring-white/10 group-hover:rotate-12 group-hover:scale-110` 
                : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500'
            }`}>
              {isUnlocked ? getIcon(badge.icon, 28) : <Lock size={24} />}
            </div>
            
            {/* Text Content */}
            <div className="relative z-10 mt-2 space-y-3">
              <h4 className={`text-xl font-black leading-tight tracking-tight uppercase ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {badge.title.split(' ').map((word, i) => (
                  <span key={i} className="block">{word}</span>
                ))}
              </h4>
              <p className={`text-xs font-bold leading-relaxed px-1 ${isUnlocked ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                {badge.description}
              </p>
            </div>

            {/* Locked Overlay/Badge logic */}
            {!isUnlocked && (
              <div className="mt-auto mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
                Locked
              </div>
            )}
            
            {/* Background Accent glow for unlocked */}
            {isUnlocked && (
              <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 blur-[40px] opacity-20 bg-gradient-to-t ${badge.color}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
};
