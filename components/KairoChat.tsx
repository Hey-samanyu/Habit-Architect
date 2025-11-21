import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, Minus, ChevronRight, Zap, Plus, Target, Activity, Mic, MicOff, Volume2 } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { Habit, Goal, DailyLog } from '../types';
import { createChatSession, speakText } from '../services/geminiService';

interface KairoChatProps {
  habits: Habit[];
  goals: Goal[];
  logs: Record<string, DailyLog>;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const QUICK_ACTIONS = [
  "Analyze my progress 📊",
  "I need motivation 🚀",
  "Why did I miss yesterday? 🤔",
  "Help me set a new goal 🎯"
];

export const KairoChat: React.FC<KairoChatProps> = ({ habits, goals, logs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hey! I'm Kairo. Ready to crush it today? 🌟" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Refs
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, showContextPicker]);

  // Hide teaser when opened
  useEffect(() => {
    if (isOpen) setShowTeaser(false);
  }, [isOpen]);

  // Initialize chat session when opened
  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      const session = createChatSession(habits, goals, logs);
      if (session) {
        chatSessionRef.current = session;
      } else {
        setMessages(prev => [
          ...prev, 
          { 
            role: 'model', 
            text: "⚠️ Connection Error: API Key is missing.\n\nIf you just added it to Vercel, you MUST redeploy:\n1. Go to Vercel Dashboard > Deployments.\n2. Click the three dots (...) next to the latest deploy.\n3. Click 'Redeploy'.\n\nThis injects the new key into the app." 
          }
        ]);
      }
    }
  }, [isOpen, habits, goals, logs]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input.trim();
    if (!textToSend || !chatSessionRef.current) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setIsTyping(true);
    setShowContextPicker(false); // Close picker if open

    try {
      const response: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: textToSend });
      const aiMsg = response.text || "I'm speechless!";
      setMessages(prev => [...prev, { role: 'model', text: aiMsg }]);
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Oops, I tripped over a virtual wire. Try asking again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice Input Logic
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(prev => {
            // Append to existing text with a space if needed
            return prev ? `${prev} ${transcript}` : transcript;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  // Helper to remove markdown bolding symbols if they slip through
  const cleanText = (text: string) => {
    return text.replace(/\*\*/g, ''); 
  };

  const handleAnalyzeItem = (type: 'habit' | 'goal', name: string) => {
      const prompt = type === 'habit' 
          ? `Analyze my performance on the habit "${name}". Be specific about my streak and consistency.` 
          : `Review my progress on the goal "${name}". Am I on track?`;
      handleSend(prompt);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Teaser Bubble */}
        {showTeaser && (
          <div className="bg-white px-4 py-3 rounded-2xl rounded-br-none shadow-xl border border-slate-100 animate-in slide-in-from-right-10 duration-500 max-w-[200px]">
            <p className="text-base text-slate-700 font-medium">
              Stats looking good! Want a quick analysis? 👀
            </p>
            <button 
              onClick={() => setShowTeaser(false)}
              className="absolute -top-2 -left-2 bg-slate-200 rounded-full p-1 hover:bg-slate-300"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="group bg-indigo-600 hover:bg-indigo-700 text-white pl-5 pr-7 py-4 rounded-full shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1 flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot size={28} className="group-hover:rotate-12 transition-transform" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-pulse"></div>
          </div>
          <div className="text-left">
            <div className="font-bold text-base leading-tight">Ask Kairo</div>
            <div className="text-xs text-indigo-200 font-medium uppercase tracking-wider">AI Habit Coach</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-[420px] h-[650px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom-10 duration-300 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 flex items-center justify-between text-white shadow-md relative overflow-hidden">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Kairo</h3>
            <p className="text-sm text-indigo-100 font-medium flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              Your Personal Coach
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
        >
          <Minus size={24} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 relative">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group relative`}
          >
            <div 
              className={`max-w-[88%] p-4 rounded-2xl text-base leading-relaxed shadow-sm font-medium whitespace-pre-wrap relative ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-slate-100'
              }`}
            >
              {cleanText(msg.text)}
            </div>

            {/* Play Button for Kairo's messages */}
            {msg.role === 'model' && (
                <button 
                    onClick={() => speakText(msg.text)}
                    className="absolute -right-10 top-2 p-2 text-slate-300 hover:text-indigo-600 transition-colors hover:bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100"
                    title="Listen"
                >
                    <Volume2 size={18} />
                </button>
            )}
          </div>
        ))}
        
        {/* Quick Actions (Show if only 1 message from bot exists) */}
        {messages.length === 1 && (
          <div className="grid grid-cols-1 gap-2.5 mt-4 px-2">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider ml-1">Suggested</p>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                className="text-left px-4 py-3.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-base text-slate-700 font-semibold transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                {action}
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400" />
              </button>
            ))}
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative">
        
        {/* Context Picker Overlay (Moved here to stay fixed above input) */}
        {showContextPicker && (
            <div className="absolute bottom-full left-4 right-4 mb-4 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in zoom-in-95 duration-200 max-h-[300px] overflow-y-auto z-20">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Item to Analyze</h4>
                    <button onClick={() => setShowContextPicker(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={14}/></button>
                </div>
                
                <div className="space-y-4">
                    {habits.length > 0 && (
                        <div>
                            <h5 className="text-sm font-bold text-indigo-600 mb-2 flex items-center gap-1"><Activity size={14}/> Habits</h5>
                            <div className="grid grid-cols-1 gap-2">
                                {habits.map(h => (
                                    <button 
                                        key={h.id}
                                        onClick={() => handleAnalyzeItem('habit', h.title)}
                                        className="text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-sm font-medium transition-colors border border-slate-100 hover:border-indigo-200 truncate"
                                    >
                                        {h.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {goals.length > 0 && (
                        <div>
                            <h5 className="text-sm font-bold text-amber-600 mb-2 flex items-center gap-1"><Target size={14}/> Goals</h5>
                            <div className="grid grid-cols-1 gap-2">
                                {goals.map(g => (
                                    <button 
                                        key={g.id}
                                        onClick={() => handleAnalyzeItem('goal', g.title)}
                                        className="text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-sm font-medium transition-colors border border-slate-100 hover:border-amber-200 truncate"
                                    >
                                        {g.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {habits.length === 0 && goals.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-2">No active habits or goals found.</p>
                    )}
                </div>
            </div>
        )}

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
          <button
            onClick={() => setShowContextPicker(!showContextPicker)}
            className={`p-2.5 rounded-xl transition-colors ${showContextPicker ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
            title="Pick a habit or goal to analyze"
          >
            <Plus size={20} className={showContextPicker ? 'rotate-45 transition-transform' : 'transition-transform'} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Ask for advice..."}
            className="flex-1 bg-transparent px-2 py-2.5 text-base text-slate-800 font-medium outline-none placeholder:text-slate-400"
          />
          
          {/* Voice Input Button */}
           <button
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
            }`}
            title="Voice Input"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};