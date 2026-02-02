
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Volume2, VolumeX, RotateCcw, CheckCircle2 } from 'lucide-react';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  habitTitle?: string;
  onComplete: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ isOpen, onClose, habitTitle, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 mins
  const [isActive, setIsActive] = useState(false);
  const [isWhiteNoiseOn, setIsWhiteNoiseOn] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const whiteNoiseNodeRef = useRef<AudioNode | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      playBell();
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // White Noise Synthesis
  const toggleWhiteNoise = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (isWhiteNoiseOn) {
      whiteNoiseNodeRef.current?.disconnect();
      whiteNoiseNodeRef.current = null;
      setIsWhiteNoiseOn(false);
    } else {
      const bufferSize = 2 * audioCtxRef.current.sampleRate;
      const noiseBuffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioCtxRef.current.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = audioCtxRef.current.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      const gainNode = audioCtxRef.current.createGain();
      gainNode.gain.value = 0.05; // Very soft

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);

      whiteNoise.start();
      whiteNoiseNodeRef.current = whiteNoise;
      setIsWhiteNoiseOn(true);
    }
  };

  // Bell Synthesis (Chime)
  const playBell = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 2);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 transition-colors duration-700 animate-in fade-in zoom-in-95">
      <button 
        onClick={() => {
          if (whiteNoiseNodeRef.current) toggleWhiteNoise();
          onClose();
        }}
        className="absolute top-8 right-8 p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
      >
        <X size={32} />
      </button>

      <div className="text-center space-y-12 max-w-2xl w-full">
        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600">Deep Focus Phase</p>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
            {habitTitle || "Strategic Silence"}
          </h2>
        </div>

        <div className="text-[12rem] md:text-[16rem] font-black text-slate-900 dark:text-white leading-none tracking-tighter tabular-nums selection:bg-transparent">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center justify-center gap-8">
          <button 
            onClick={toggleWhiteNoise}
            className={`p-6 rounded-3xl border transition-all ${
              isWhiteNoiseOn 
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-200 dark:shadow-none' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
            title="Toggle White Noise"
          >
            {isWhiteNoiseOn ? <Volume2 size={32} /> : <VolumeX size={32} />}
          </button>

          <button 
            onClick={() => setIsActive(!isActive)}
            className="p-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            {isActive ? <Pause size={48} strokeWidth={3} /> : <Play size={48} strokeWidth={3} className="ml-2" />}
          </button>

          <button 
            // Fix: RotateCcw was used but imported as RotateCcml
            onClick={() => {
              setIsActive(false);
              setTimeLeft(25 * 60);
            }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-3xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw size={32} />
          </button>
        </div>

        <div className="pt-12">
           <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-sm uppercase tracking-widest">
              <CheckCircle2 size={16} /> 
              Habit will mark complete on finish
           </div>
        </div>
      </div>
    </div>
  );
};
