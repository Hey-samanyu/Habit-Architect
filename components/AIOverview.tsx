
import React, { useState } from 'react';
import { Brain, Sparkles, RefreshCw, Lightbulb, Share2 } from 'lucide-react';
import { generateDailyOverview } from '../services/geminiService';
import { Habit, Goal, DailyLog } from '../types';
import { format } from 'date-fns';

interface AIOverviewProps {
  habits: Habit[];
  goals: Goal[];
  logs: Record<string, DailyLog>;
}

export const AIOverview: React.FC<AIOverviewProps> = ({ habits, goals, logs }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateDailyOverview(habits, goals, logs);
    setAnalysis(result);
    setLoading(false);
  };

  const handleShareToWhatsApp = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayLog = logs[todayStr];
    const completedCount = todayLog?.completedHabitIds.length || 0;
    const totalHabits = habits.length;
    let message = `*🚀 Habit Architect Daily Update - ${format(new Date(), 'MMM do')}*\n\n`;
    message += `📊 *Progress:* ${completedCount}/${totalHabits} Habits Done\n`;
    const activeGoal = goals.find(g => g.current < g.target);
    if (activeGoal) {
        const percent = Math.floor((activeGoal.current / activeGoal.target) * 100);
        message += `🎯 *Goal Focus:* ${activeGoal.title} (${percent}%)\n`;
    }
    if (analysis) {
        const cleanAnalysis = analysis.replace(/\*\*/g, '*');
        message += `\n🤖 *Kairo's Insight:*\n${cleanAnalysis}`;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-bl-full -mr-16 -mt-16 z-0 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600 p-2.5 rounded-xl shadow-lg shadow-violet-100">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Kairo Insights</h2>
              <p className="text-xs text-slate-500 font-black uppercase tracking-widest">Architectural Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={handleShareToWhatsApp}
                className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all"
                title="Share to WhatsApp"
              >
                <Share2 size={20} />
              </button>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {analysis ? "Refresh" : "Insight"}
              </button>
          </div>
        </div>

        {analysis ? (
          <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 animate-in fade-in duration-500">
            <p className="whitespace-pre-wrap leading-relaxed text-slate-900 font-semibold text-lg">
              {analysis}
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[1.5rem] p-10 border border-dashed border-slate-300 text-center">
            <Lightbulb className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-slate-600 font-bold text-base">
              Initialize Kairo to analyze your structural routines and performance trends.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
