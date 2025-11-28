import React from 'react';
import { Trophy, Flame, Target, Zap, Crown, Star, Lock, CheckCircle2, Rocket, Shield } from 'lucide-react';
import { Badge } from '../types';
import { Card } from './UIComponents';

export const BADGES_LIST: Badge[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Created your first habit',
    icon: 'Star',
    color: 'bg-blue-500',
    condition: 'Create 1 habit'
  },
  {
    id: 'streak_3',
    title: 'Momentum',
    description: 'Reached a 3-day streak',
    icon: 'Zap',
    color: 'bg-amber-500',
    condition: '3 day streak'
  },
  {
    id: 'streak_7',
    title: 'On Fire',
    description: 'Reached a 7-day streak',
    icon: 'Flame',
    color: 'bg-orange-500',
    condition: '7 day streak'
  },
  {
    id: 'streak_30',
    title: 'Habit Master',
    description: 'Reached a 30-day streak',
    icon: 'Crown',
    color: 'bg-purple-500',
    condition: '30 day streak'
  },
  {
    id: 'goal_getter',
    title: 'Goal Getter',
    description: 'Completed your first goal',
    icon: 'Target',
    color: 'bg-emerald-500',
    condition: 'Complete 1 goal'
  },
  {
    id: 'consistent',
    title: 'Consistent',
    description: 'Completed 50 total habits',
    icon: 'CheckCircle2',
    color: 'bg-indigo-500',
    condition: '50 total logs'
  },
  {
    id: 'architect',
    title: 'The Architect',
    description: 'Have 5 active habits',
    icon: 'Shield',
    color: 'bg-rose-500',
    condition: '5 active habits'
  },
  {
    id: 'high_flyer',
    title: 'High Flyer',
    description: 'Hit 100% completion today',
    icon: 'Rocket',
    color: 'bg-pink-500',
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

  const earnedCount = earnedBadgeIds.length;
  const progress = Math.round((earnedCount / BADGES_LIST.length) * 100);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-800 dark:to-indigo-800 text-white border-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">Your Trophy Case</h3>
            <p className="text-violet-100 text-sm">Collect badges by staying consistent.</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Trophy size={24} className="text-yellow-300" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-violet-200">
            <span>Progress</span>
            <span>{earnedCount} / {BADGES_LIST.length} Badges</span>
          </div>
          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {BADGES_LIST.map((badge) => {
          const isUnlocked = earnedBadgeIds.includes(badge.id);
          
          return (
            <div 
              key={badge.id}
              className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 group ${
                isUnlocked 
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-1' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-70'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 ${
                isUnlocked ? `${badge.color} text-white shadow-lg` : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}>
                {isUnlocked ? getIcon(badge.icon, 24) : <Lock size={20} />}
              </div>
              
              <h4 className={`font-bold mb-1 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {badge.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {badge.description}
              </p>

              {isUnlocked && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/20 to-white/0 rounded-bl-full z-10 pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};