import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, Minus, ChevronRight, Zap, Plus, Target, Activity, Mic, MicOff, Volume2, Trash2 } from 'lucide-react';
import { Chat, GenerateContentResponse, Content } from "@google/genai";
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

const STORAGE_KEY = 'habit_architect_chat_history';

export const KairoChat: React.FC<KairoChatProps> = ({ habits, goals, logs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse chat history", e);
        }
      }
    }
    return [{ role: 'model', text: "Hey! I'm Kairo. Ready to crush it today? 🌟" }];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, showContextPicker]);

  useEffect(() => {
    if (isOpen) setShowTeaser(false);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      const history: Content[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const session = createChatSession(habits, goals, logs, history);
      
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
    setShowContextPicker(false); 

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

  const clearHistory = () => {
    if(confirm("Clear chat history?")) {
        const initialMsg: Message = { role: 'model', text: "History cleared! What should we focus on now?" };
        setMessages([initialMsg]);
        localStorage.removeItem(STORAGE_KEY);
        chatSessionRef.current = null;
        setIsOpen(false); 
        setTimeout(() => setIsOpen(true), 100);
    }
  };

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
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      }
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

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
        {showTeaser && (
          <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-br-none shadow-xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-right-10 duration-500 max-w-[200px]">
            <p className="text-base text-slate-700 dark:text-slate-300 font-medium">
              Stats looking good! Want a quick analysis? 👀
            </p>
            <button 
              onClick={() => setShowTeaser(false)}
              className="absolute -top-2 -left-2 bg-slate-200 dark:bg-slate-700 rounded-full p-1 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="group bg-violet-600 hover:bg-violet-700 text-white pl-5 pr-7 py-4 rounded-full shadow-xl shadow-violet-200 dark:shadow-none transition-all hover:-translate-y-1 flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot size={28} className="group-hover:rotate-12 transition-transform" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-violet-600 animate-pulse"></div>
          </div>
          <div className="text-left">
            <div className="font-bold text-base leading-tight">Ask Kairo</div>
            <div className="text-xs text-violet-200 font-medium uppercase tracking-wider">AI Habit Coach</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-[420px] h-[650px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-bottom-10 duration-300 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 flex items-center justify-between text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Kairo</h3>
            <p className="text-sm text-violet-100 font-medium flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              Your Personal Coach
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 relative z-10">
            <button 
              onClick={clearHistory}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-violet-100 hover:text-white"
              title="Clear Chat History"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <Minus size={24} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-slate-900/50 relative">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group relative`}
          >
            <div 
              className={`max-w-[88%] p-4 rounded-2xl text-base leading-relaxed shadow-sm font-medium whitespace-pre-wrap relative ${
                msg.role === 'user' 
                  ? 'bg-violet-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none shadow-slate-100 dark:shadow-none'
              }`}
            >
              {cleanText(msg.text)}
            </div>

            {msg.role === 'model' && (
                <button 
                    onClick={() => speakText(msg.text)}
                    className="absolute -right-10 top-2 p-2 text-slate-300 dark:text-slate-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors hover:bg-violet-50 dark:hover:bg-slate-800 rounded-full opacity-0 group-hover:opacity-100"
                    title="Listen"
                >
                    <Volume2 size={18} />
                </button>
            )}
          </div>
        ))}
        
        {messages.length === 1 && (
          <div className="grid grid-cols-1 gap-2.5 mt-4 px-2">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider ml-1">Suggested</p>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                className="text-left px-4 py-3.5 bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-violet-200 dark:hover:border-slate-600 rounded-xl text-base text-slate-700 dark:text-slate-300 font-semibold transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                {action}
                <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-violet-400" />
              </button>
            ))}
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative">
        
        {showContextPicker && (
            <div className="absolute bottom-full left-4 right-4 mb-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 animate-in zoom-in-95 duration-200 max-h-[300px] overflow-y-auto z-20">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Item to Analyze</h4>
                    <button onClick={() => setShowContextPicker(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400"><X size={14}/></button>
                </div>
                
                <div className="space-y-4">
                    {habits.length > 0 && (
                        <div>
                            <h5 className="text-sm font-bold text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1"><Activity size={14}/> Habits</h5>
                            <div className="grid grid-cols-1 gap-2">
                                {habits.map(h => (
                                    <button 
                                        key={h.id}
                                        onClick={() => handleAnalyzeItem('habit', h.title)}
                                        className="text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 text-sm font-medium transition-colors border border-slate-100 dark:border-slate-600 hover:border-violet-200 dark:hover:border-violet-700 truncate text-slate-700 dark:text-slate-300"
                                    >
                                        {h.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {goals.length > 0 && (
                        <div>
                            <h5 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1"><Target size={14}/> Goals</h5>
                            <div className="grid grid-cols-1 gap-2">
                                {goals.map(g => (
                                    <button 
                                        key={g.id}
                                        onClick={() => handleAnalyzeItem('goal', g.title)}
                                        className="text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-medium transition-colors border border-slate-100 dark:border-slate-600 hover:border-amber-200 dark:hover:border-amber-700 truncate text-slate-700 dark:text-slate-300"
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

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-50 dark:focus-within:ring-violet-900/20 transition-all">
          <button
            onClick={() => setShowContextPicker(!showContextPicker)}
            className={`p-2.5 rounded-xl transition-colors ${showContextPicker ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
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
            className="flex-1 bg-transparent px-2 py-2.5 text-base text-slate-800 dark:text-white font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          
           <button
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200 dark:shadow-none' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Voice Input"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-200 dark:shadow-none active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};