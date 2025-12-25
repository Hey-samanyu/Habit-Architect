
import React, { useState } from 'react';
import { Plus, Calendar, Layout, BarChart3, CheckCircle2, Target, Menu, X, Home, ListChecks, PieChart, Activity, RotateCcw, Bell, LogOut, Medal, Moon, Sun, AlertTriangle, Sparkles } from 'lucide-react';
import { AppState, Frequency } from '../types';

// This file contains the core habit toggling logic and confetti triggers.
// We wrap it in a component to provide the necessary React context for hooks.

const triggerConfetti = () => {
  // confetti is assumed to be available globally via a script tag
  // @ts-ignore
  if (typeof confetti !== 'undefined') {
    // @ts-ignore
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#6366f1', '#d946ef']
    });
  }
};

const App = () => {
  const [state, setState] = useState<AppState>({ habits: [], goals: [], logs: {}, earnedBadges: [] });
  
  const getTodayKey = () => new Date().toISOString().split('T')[0];

  // Fix: toggleHabit and setState must be within the component scope
  const toggleHabit = (id: string) => {
    const todayKey = getTodayKey();
    
    // Fix for Line 21: setState is now defined within the component
    setState(prev => {
      // Fix for Line 23: defining currentLog within the state updater scope
      const currentLog = prev.logs[todayKey] || { date: todayKey, completedHabitIds: [], goalProgress: {} };
      const isNowCompleted = !currentLog.completedHabitIds.includes(id);
      
      if (isNowCompleted) {
        // Trigger small blast for single habit completion
        triggerConfetti();
      }

      const newCompletedIds = isNowCompleted 
        ? [...currentLog.completedHabitIds, id]
        : currentLog.completedHabitIds.filter(hid => hid !== id);

      return {
        ...prev,
        logs: { 
          ...prev.logs, 
          [todayKey]: { ...currentLog, completedHabitIds: newCompletedIds } 
        }
      };
    });
  };

  return null; // This component serves as a logic container or is extended elsewhere
};

export default App;
