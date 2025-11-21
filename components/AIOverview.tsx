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
    
    // 1. Build the message header
    let message = `*🚀 HabitFlow Daily Update - ${format(new Date(), 'MMM do')}*\n\n`;
    
    // 2. Add Stats
    message += `📊 *Progress:* ${completedCount}/${totalHabits} Habits Done\n`;
    
    // 3. Add High Streaks
    const highStreaks = habits.filter(h => h.streak > 3).map(h => h.title);
    if (highStreaks.length > 0) {
        message += `🔥 *On Fire:* ${highStreaks.slice(0, 3).join(', ')}\n`;
    }

    // 4. Add Goal Progress
    const activeGoal = goals.find(g => g.current < g.target);
    if (activeGoal) {
        const percent = Math.floor((activeGoal.current / activeGoal.target) * 100);
        message += `🎯 *Goal Focus:* ${activeGoal.title} (${percent}%)\n`;
    }

    // 5. Add AI Insight (if generated)
    if (analysis) {
        // Clean up markdown bolding for WhatsApp (*text*)
        const cleanAnalysis = analysis.replace(/\*\*/g, '*');
        message += `\n🤖 *Kairo's Insight:*\n${cleanAnalysis}`;
    } else {
        message += `\nCheck out my progress on HabitFlow!`;
    }

    // 6. Encode and Open
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -mr-16 -mt-16 z-0 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm shadow-indigo-200">
              <Brain className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">AI Coach</h2>
              <p className="text-xs text-slate-500 font-medium">Powered by Gemini</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Share Button */}
             <button 
                onClick={handleShareToWhatsApp}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all border border-emerald-100"
                title="Share to WhatsApp"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline text-xs font-bold">Share</span>
              </button>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
                {analysis ? "Refresh" : "Insight"}
              </button>
          </div>
        </div>

        {analysis ? (
          <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-100 animate-in fade-in duration-500">
            <div className="prose prose-indigo prose-sm w-full max-w-none">
               <p className="whitespace-pre-wrap leading-relaxed text-slate-800 font-medium">
                 {analysis}
               </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-8 border border-dashed border-slate-200 text-center">
            <Lightbulb className="mx-auto text-slate-400 mb-2" size={24} />
            <p className="text-slate-600 text-sm font-medium">
              Tap the button to analyze your habit patterns and get daily advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};