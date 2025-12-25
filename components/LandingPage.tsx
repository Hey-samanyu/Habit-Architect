
import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Sparkles, Brain, ArrowRight, Zap, Shield, Trophy, 
  ChevronRight, Check, MousePointer2, Layers, 
  Fingerprint, Compass, Maximize
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHabitTicked, setIsHabitTicked] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const triggerHeroConfetti = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHabitTicked(!isHabitTicked);
    if (!isHabitTicked) {
      // @ts-ignore
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: ['#7c3aed', '#6366f1', '#d946ef']
      });
    }
  };

  return (
    <div className="relative font-sans bg-slate-50 blueprint-grid selection:bg-violet-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[60] h-24 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-violet-600 p-2.5 rounded-xl shadow-lg shadow-violet-200 group-hover:rotate-12 transition-transform">
              <Layout className="text-white" size={26} />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900">
              Habit<span className="text-violet-600">Architect</span>
            </h1>
          </div>
          
          <button 
            onClick={onStart}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-sm transition-all hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-xl"
          >
            Enter Dashboard
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen pt-48 pb-20 px-6 flex flex-col items-center overflow-hidden">
        {/* Animated Background Orb */}
        <div 
          className="absolute w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-[140px] pointer-events-none transition-transform duration-1000 ease-out z-0"
          style={{ 
            transform: `translate(${(mousePos.x - window.innerWidth/2) * 0.04}px, ${(mousePos.y - window.innerHeight/2) * 0.04}px)` 
          }}
        ></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
          <div className="lg:col-span-7 space-y-10 text-left">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-violet-600/10 border border-violet-600/20 text-violet-700 text-sm font-black uppercase tracking-[0.15em] animate-in fade-in slide-in-from-left-4">
              <Sparkles size={16} fill="currentColor" />
              <span>Architect Suite v2.0</span>
            </div>

            <h2 className="text-7xl md:text-8xl font-black tracking-tighter leading-[0.85] text-slate-900">
              Stop tracking.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600">
                Design Routines.
              </span>
            </h2>

            <p className="text-2xl text-slate-600 max-w-2xl font-semibold leading-relaxed">
              The world's first habit design environment built with architectural precision and world-class AI coaching.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <button 
                onClick={onStart}
                className="group relative w-full sm:w-auto px-10 py-6 bg-violet-600 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-violet-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 overflow-hidden"
              >
                Begin Construction
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
              
              <div className="flex items-center gap-3 text-slate-600 font-black text-sm uppercase tracking-widest px-4 py-2 bg-white/80 rounded-2xl border border-slate-200 shadow-sm">
                <MousePointer2 size={18} />
                <span>Interact with the Blueprint</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative group">
              <div className="absolute -inset-8 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 rounded-[4rem] blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
              
              <div className="relative bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700 hover:scale-[1.03]">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-200">
                      <Fingerprint size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-base uppercase tracking-wider text-slate-900">Live Prototype</h4>
                      <p className="text-xs font-bold text-slate-500">Architectural Core</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-emerald-500/10 rounded-full text-emerald-600 animate-pulse">
                    <Zap size={18} fill="currentColor" />
                  </div>
                </div>

                {/* The Interactive Habit Card */}
                <div 
                  onClick={triggerHeroConfetti}
                  className={`cursor-pointer p-8 rounded-[2rem] transition-all duration-500 border-2 shadow-sm ${
                    isHabitTicked 
                      ? 'bg-emerald-50 border-emerald-500/40 translate-y-2' 
                      : 'bg-slate-50 border-slate-100 hover:border-violet-500/40 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${
                      isHabitTicked ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 rotate-[-10deg]'
                    }`}>
                      <Check size={32} strokeWidth={4} className={isHabitTicked ? 'scale-100' : 'scale-0 transition-transform'} />
                    </div>
                    <div>
                      <h5 className={`font-black text-xl mb-1 ${isHabitTicked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>Deep Meditation</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-0.5 rounded">Daily</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-1.5 h-4 rounded-full ${i <= 3 || isHabitTicked ? 'bg-violet-600' : 'bg-slate-300'}`}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-5">
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-fuchsia-500 transition-all duration-1000"
                      style={{ width: isHabitTicked ? '100%' : '60%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-800 uppercase tracking-[0.2em]">
                    <span>Structural Integrity</span>
                    <span className="text-violet-600">{isHabitTicked ? '100%' : '60%'}</span>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-8 -right-8 bg-white p-5 rounded-2xl animate-float shadow-2xl hidden md:block border border-slate-100" style={{ animationDelay: '1s' }}>
                <Trophy className="text-amber-500" size={32} fill="currentColor" />
              </div>
              <div className="absolute -bottom-12 -left-12 bg-white p-5 rounded-2xl animate-float shadow-2xl hidden md:block border border-slate-100">
                <Brain className="text-fuchsia-600" size={32} fill="currentColor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Bento Features */}
      <section className="py-40 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 space-y-6 text-center">
            <h3 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900">Engineered Systems</h3>
            <p className="text-xl text-slate-500 font-bold max-w-2xl mx-auto">Elite behavioral architecture for high-performance individuals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <FeatureCard 
              className="md:col-span-2 bg-gradient-to-br from-violet-700 via-indigo-700 to-violet-800 text-white"
              icon={<Brain size={40} fill="currentColor" />}
              title="Kairo Neural Link"
              desc="Real-time AI coaching that doesn't just track—it talks. Get deep behavioral analysis based on your unique cognitive patterns."
              interactive={true}
              lightText={true}
            />
            <FeatureCard 
              icon={<Compass size={40} className="text-violet-600" />}
              title="Metric Mapping"
              desc="Visualize consistency through 3D spatial mapping and adaptive trend forecasting."
            />
             <FeatureCard 
              icon={<Shield size={40} className="text-emerald-600" />}
              title="Vault Sync"
              desc="Your progress is secured via Supabase AES-256 military-grade cloud encryption."
            />
            <FeatureCard 
              icon={<Layers size={40} className="text-amber-500" fill="currentColor" />}
              title="Tiered Streaks"
              desc="Watch your routines evolve from 'Spark' to 'Mastery' with architectural tiers."
            />
            <FeatureCard 
              className="md:col-span-2 border-fuchsia-200"
              icon={<Maximize size={40} className="text-fuchsia-600" />}
              title="Complex Stacks"
              desc="Architect complex habit stacks with triggers, reminders, and cross-metric goals."
              interactive={true}
            />
             <FeatureCard 
              icon={<Zap size={40} className="text-orange-500" fill="currentColor" />}
              title="Haptic Pulse"
              desc="Hyper-satisfying visual and physical feedback for every routine completed."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-200 text-center px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2.5 rounded-xl">
              <Layout className="text-white" size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.25em] text-lg text-slate-900">HabitArchitect</span>
          </div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} ARCHITECTURAL AI COLLECTIVE.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, className = "", interactive = false, lightText = false }: { icon: React.ReactNode, title: string, desc: string, className?: string, interactive?: boolean, lightText?: boolean }) => (
  <div className={`group bg-white p-10 rounded-[3rem] border border-slate-200 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl ${className}`}>
    <div className={`mb-8 transition-transform group-hover:scale-110 duration-500`}>
      {icon}
    </div>
    <h4 className={`text-2xl font-black mb-4 uppercase tracking-tight ${lightText ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
    <p className={`text-base font-bold leading-relaxed ${lightText ? 'text-violet-100' : 'text-slate-600'}`}>{desc}</p>
    {interactive && (
      <div className={`mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${lightText ? 'text-white' : 'text-violet-600'} opacity-60 group-hover:opacity-100`}>
        Explore Module <ChevronRight size={16} />
      </div>
    )}
  </div>
);
