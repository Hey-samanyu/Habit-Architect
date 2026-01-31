
import React, { useState, useEffect, useRef } from 'react';
/* Import Plus icon for use in interactive demo section */
import { 
  Layout, Sparkles, Brain, ArrowRight, Zap, Shield, Trophy, 
  ChevronRight, Check, MousePointer2, Layers, 
  Fingerprint, Compass, Maximize, ChevronLeft, ListChecks, Target, Plus, Play
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onDemo: () => void;
}

const FLOW_STEPS = [
  {
    id: 'design',
    title: 'Phase 01: System Design',
    subtitle: 'Blueprint your routines',
    description: 'Define your daily systems with architectural precision. Categorize by health, work, or mindfulness to build a balanced structural foundation.',
    icon: <ListChecks className="text-violet-600" size={32} />,
    color: 'bg-violet-600'
  },
  {
    id: 'execute',
    title: 'Phase 02: Structural Execution',
    subtitle: 'Construct your consistency',
    description: 'Execute your plan with hyper-satisfying haptic feedback. Watch your integrity bars fill as you solidify your behavioral framework.',
    icon: <Zap className="text-emerald-600" size={32} fill="currentColor" />,
    color: 'bg-emerald-600'
  },
  {
    id: 'refine',
    title: 'Phase 03: Neural Refinement',
    subtitle: 'Optimize for performance',
    description: 'Let Kairo, your AI architectural auditor, analyze your data. Receive deep insights to patch structural weaknesses and scale your successes.',
    icon: <Brain className="text-indigo-600" size={32} fill="currentColor" />,
    color: 'bg-indigo-600'
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onDemo }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHabitTicked, setIsHabitTicked] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
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

  const nextStep = () => setActiveStep((prev) => (prev + 1) % FLOW_STEPS.length);
  const prevStep = () => setActiveStep((prev) => (prev - 1 + FLOW_STEPS.length) % FLOW_STEPS.length);

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
          
          <div className="flex items-center gap-4">
            <button 
                onClick={onDemo}
                className="hidden md:flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-black text-sm uppercase tracking-widest transition-all hover:bg-slate-100 rounded-xl"
            >
                <Play size={16} fill="currentColor" /> Try Live Demo
            </button>
            <button 
                onClick={onStart}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-sm transition-all hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-xl"
            >
                Login / Signup
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen pt-48 pb-20 px-6 flex flex-col items-center overflow-hidden">
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

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={onStart}
                className="group relative w-full sm:w-auto px-10 py-6 bg-violet-600 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-violet-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 overflow-hidden"
              >
                Begin Construction
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
              <button 
                onClick={onDemo}
                className="w-full sm:w-auto px-10 py-6 bg-white text-slate-900 border-2 border-slate-200 rounded-[2rem] font-black text-2xl transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 flex items-center justify-center gap-4"
              >
                Try Demo
              </button>
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

                <div 
                  onClick={triggerHeroConfetti}
                  className={`cursor-pointer p-8 rounded-[2rem] transition-all duration-500 border-2 shadow-sm group/card ${
                    isHabitTicked 
                      ? 'bg-emerald-50 border-emerald-500/40 translate-y-2' 
                      : 'bg-slate-50 border-slate-100 hover:border-violet-500/40 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 relative shadow-inner ${
                      isHabitTicked 
                        ? 'bg-emerald-500 border-emerald-400 text-white' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-400 rotate-[-5deg]'
                    }`}>
                      <Check 
                        size={32} 
                        strokeWidth={4} 
                        className={`transition-all duration-500 ${isHabitTicked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} 
                      />
                      {!isHabitTicked && (
                        <Check 
                          size={32} 
                          strokeWidth={4} 
                          className="absolute opacity-0 group-hover/card:opacity-20 transition-opacity text-violet-600" 
                        />
                      )}
                    </div>
                    <div>
                      <h5 className={`font-black text-xl mb-1 ${isHabitTicked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>Deep Meditation</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-0.5 rounded">Daily</span>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Interactive Flow Carousel */}
      <section className="py-40 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 to-transparent opacity-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 space-y-12">
              <div className="space-y-4">
                <span className="text-violet-400 font-black uppercase tracking-[0.3em] text-sm">Interactive Demo</span>
                <h3 className="text-5xl lg:text-7xl font-black tracking-tight leading-none">The Architectural Workflow</h3>
                <p className="text-slate-400 text-xl font-bold max-w-lg">How we engineer consistency from the ground up.</p>
              </div>

              <div className="space-y-10 relative">
                {FLOW_STEPS.map((step, idx) => (
                  <div 
                    key={step.id}
                    onClick={() => setActiveStep(idx)}
                    className={`cursor-pointer transition-all duration-500 p-8 rounded-[2rem] border-2 flex items-start gap-6 ${
                      activeStep === idx 
                        ? 'bg-slate-800 border-violet-500 shadow-2xl scale-105' 
                        : 'bg-transparent border-slate-800 opacity-40 hover:opacity-60'
                    }`}
                  >
                    <div className={`p-4 rounded-2xl bg-slate-900 shadow-inner shrink-0 transition-transform ${activeStep === idx ? 'scale-110' : ''}`}>
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-2xl uppercase tracking-tight mb-1">{step.title}</h4>
                      <p className={`font-bold transition-colors ${activeStep === idx ? 'text-violet-400' : 'text-slate-500'}`}>{step.subtitle}</p>
                      {activeStep === idx && (
                        <p className="mt-4 text-slate-300 font-medium leading-relaxed animate-in fade-in slide-in-from-left-2 duration-500">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Preview Side */}
            <div className="lg:w-1/2 relative h-[600px] w-full flex items-center justify-center">
              <div className="absolute -inset-20 bg-violet-600/20 rounded-full blur-[120px] animate-pulse"></div>
              
              <div className="relative w-full max-w-md aspect-[4/5] bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden border-8 border-slate-800 transition-all duration-700">
                {/* Internal App Mockup Screen */}
                <div className="absolute inset-0 bg-slate-50 p-8 flex flex-col gap-6">
                  {/* Mock Nav */}
                  <div className="flex justify-between items-center opacity-40">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                      <div className="w-20 h-8 rounded-lg bg-slate-200"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-violet-600"></div>
                  </div>

                  {/* Dynamic Content Based on Active Step */}
                  <div className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-700" key={activeStep}>
                    {activeStep === 0 && (
                      <div className="space-y-6">
                        <div className="h-8 w-40 bg-slate-900 rounded-lg"></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-24 rounded-2xl bg-white border border-slate-200 p-4 space-y-2">
                             <div className="h-4 w-12 bg-emerald-100 rounded"></div>
                             <div className="h-4 w-full bg-slate-200 rounded"></div>
                          </div>
                          <div className="h-24 rounded-2xl bg-white border-2 border-violet-500 p-4 space-y-2 shadow-lg scale-105">
                             <div className="h-4 w-12 bg-violet-100 rounded"></div>
                             <div className="h-4 w-full bg-slate-200 rounded"></div>
                             <div className="h-2 w-full bg-violet-600 rounded-full"></div>
                          </div>
                        </div>
                        <div className="p-6 bg-slate-900 rounded-3xl text-white font-black text-center flex items-center justify-center gap-3">
                          <Plus size={20} /> Establish System
                        </div>
                      </div>
                    )}

                    {activeStep === 1 && (
                      <div className="space-y-6">
                         <div className="h-8 w-48 bg-slate-900 rounded-lg"></div>
                         <div className="space-y-3">
                            {[1,2,3].map(i => (
                              <div key={i} className={`p-5 rounded-2xl border flex items-center gap-4 ${i === 2 ? 'bg-emerald-50 border-emerald-500/30' : 'bg-white border-slate-100'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${i === 2 ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-slate-200'}`}>
                                  {i === 2 && <Check size={20} strokeWidth={4} />}
                                </div>
                                <div className={`h-4 bg-slate-200 rounded ${i === 1 ? 'w-32' : i === 2 ? 'w-48 opacity-40 line-through' : 'w-24'}`}></div>
                              </div>
                            ))}
                         </div>
                         <div className="flex justify-between items-center pt-4">
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                               <div className="h-full bg-violet-600 w-2/3"></div>
                            </div>
                            <span className="ml-4 font-black text-slate-900">66%</span>
                         </div>
                      </div>
                    )}

                    {activeStep === 2 && (
                      <div className="space-y-6">
                         <div className="p-6 bg-violet-600 rounded-3xl text-white space-y-4 shadow-xl">
                            <div className="flex items-center gap-3">
                               <Brain size={24} fill="currentColor" />
                               <span className="font-black uppercase tracking-widest text-xs">Neural Insights</span>
                            </div>
                            <div className="space-y-2">
                               <div className="h-3 w-full bg-white/20 rounded"></div>
                               <div className="h-3 w-5/6 bg-white/20 rounded"></div>
                               <div className="h-3 w-4/6 bg-white/20 rounded"></div>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col items-center">
                               <div className="h-4 w-12 bg-slate-100 rounded mb-2"></div>
                               <div className="text-2xl font-black text-slate-900">82%</div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col items-center">
                               <div className="h-4 w-12 bg-slate-100 rounded mb-2"></div>
                               <div className="text-2xl font-black text-slate-900">14d</div>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Arrows */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                   <button onClick={prevStep} className="p-4 rounded-full bg-slate-900 text-white hover:bg-violet-600 transition-colors shadow-xl">
                      <ChevronLeft size={24} />
                   </button>
                   <button onClick={nextStep} className="p-4 rounded-full bg-slate-900 text-white hover:bg-violet-600 transition-colors shadow-xl">
                      <ChevronRight size={24} />
                   </button>
                </div>
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
              className="md:col-span-2 border-slate-200"
              icon={<Layers size={40} className="text-amber-500" fill="currentColor" />}
              title="Tiered Streaks"
              desc="Watch your routines evolve from 'Spark' to 'Mastery' with architectural tiers and visual fire-themed tracking."
            />
            <FeatureCard 
              className="md:col-span-2 border-fuchsia-200"
              icon={<Maximize size={40} className="text-fuchsia-600" />}
              title="Complex Stacks"
              desc="Architect complex habit stacks with triggers, reminders, and cross-metric goals for maximum structural integrity."
              interactive={true}
            />
             <FeatureCard 
              className="md:col-span-2 border-emerald-100"
              icon={<Zap size={40} className="text-orange-500" fill="currentColor" />}
              title="Haptic Pulse"
              desc="Hyper-satisfying visual and physical feedback for every routine completed, making consistency feel rewarding."
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
