
import React from 'react';
import { Layout, CheckCircle2, Target, Sparkles, Brain, ArrowRight, Zap, Shield, Trophy, Activity, Moon, Sun, ChevronDown, Flame } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, isDarkMode, toggleDarkMode }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600 p-2 rounded-xl shadow-lg shadow-violet-900/20">
              <Layout className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Habit<span className="text-violet-600 dark:text-violet-400">Architect</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={onStart}
              className="hidden md:block bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg shadow-violet-200 dark:shadow-none"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* Decorative Blur Orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-400/20 dark:bg-violet-600/10 blur-[120px] rounded-full -z-10 pointer-events-none animate-pulse"></div>
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-sm font-bold mb-8 animate-in slide-in-from-bottom-4">
            <Sparkles size={16} />
            <span>AI-Powered Personal Transformation</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900 dark:text-white">
            Design your discipline.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">Build your legacy.</span>
          </h2>
          
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Stop tracking. Start engineering. Habit Architect combines world-class aesthetics with Gemini AI coaching to turn your goals into automatic routines.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-violet-300 dark:shadow-none transition-all hover:-translate-y-1 flex items-center justify-center gap-3 active:scale-95"
            >
              Start Building Now
              <ArrowRight size={22} />
            </button>
            <button 
              className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              Watch Video
            </button>
          </div>

          {/* App Preview Mockup */}
          <div className="relative max-w-4xl mx-auto animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-slate-700/50">
              <div className="bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden aspect-video relative">
                {/* Simulated UI elements for aesthetic preview */}
                <div className="absolute top-8 left-8 right-8 flex items-start justify-between">
                    <div className="space-y-4 w-1/2 text-left">
                        <div className="h-8 w-40 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                        <div className="h-24 w-full bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800 p-4">
                            <div className="h-4 w-3/4 bg-violet-200 dark:bg-violet-700 rounded mb-2"></div>
                            <div className="h-4 w-1/2 bg-violet-200 dark:bg-violet-700 rounded"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl"></div>
                            <div className="h-16 bg-blue-50 dark:bg-blue-950/30 rounded-xl"></div>
                        </div>
                    </div>
                    <div className="w-1/3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 h-64 shadow-xl">
                        <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
                        <div className="space-y-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-800"></div>
                                    <div className="h-3 flex-1 bg-slate-100 dark:bg-slate-700 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Decorative overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-transparent to-transparent"></div>
              </div>
            </div>
            
            {/* Floating feature icons */}
            <div className="absolute -top-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-bounce transition-colors duration-300" style={{ animationDuration: '3s' }}>
                <Flame className="text-orange-500" size={32} />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-bounce transition-colors duration-300" style={{ animationDuration: '4s' }}>
                <Brain className="text-violet-600" size={32} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Engineered for Results</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Why Habit Architect is different from standard checklists.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="text-violet-600" />}
              title="Kairo AI Coaching"
              description="Not just data. Dialogue. Kairo analyzes your trends and talks to you like a world-class high-performance coach."
            />
            <FeatureCard 
              icon={<Zap className="text-amber-500" />}
              title="Tiered Streaks"
              description="Visual fire. Watch your progress transform from a Spark to Mastery with evolving visual tiers as you stay consistent."
            />
            <FeatureCard 
              icon={<Shield className="text-emerald-600" />}
              title="Cloud Architecture"
              description="Never lose a day. Automatic Supabase sync keeps your progress alive across all your devices, forever."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
           
           <h3 className="text-4xl font-extrabold mb-6 relative z-10">Ready to start designing?</h3>
           <p className="text-xl text-violet-100 mb-10 relative z-10 max-w-lg mx-auto">
             Join thousands of people who have moved past simple tracking into architecting their ideal life.
           </p>
           <button 
             onClick={onStart}
             className="bg-white text-violet-700 hover:bg-slate-50 px-12 py-5 rounded-2xl font-extrabold text-xl transition-all shadow-xl active:scale-95 relative z-10"
           >
             Build Your First Habit
           </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-lg">
              <Layout className="text-slate-600 dark:text-slate-400" size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">
              HabitArchitect
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-500 font-medium">
            © {new Date().getFullYear()} Habit Architect AI. All rights reserved.
          </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-900/50 transition-all hover:shadow-xl group">
    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h4 className="text-xl font-bold mb-3">{title}</h4>
    <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
      {description}
    </p>
  </div>
);
