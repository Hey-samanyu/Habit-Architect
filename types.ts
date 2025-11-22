export enum Category {
  HEALTH = 'Health',
  WORK = 'Work',
  LEARNING = 'Learning',
  MINDFULNESS = 'Mindfulness',
  OTHER = 'Other'
}

export enum Frequency {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  ONCE = 'Once'
}

export interface User {
  id: string;
  email?: string;
}

export interface Habit {
  id: string;
  title: string;
  category: Category;
  createdAt: string;
  streak: number;
  frequency: Frequency;
  reminderTime?: string; // Format "HH:MM" (24h)
}

export interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string; // e.g., 'pages', 'mins', 'km'
  frequency: Frequency;
  deadline?: string;
}

// Keyed by YYYY-MM-DD
export interface DailyLog {
  date: string;
  completedHabitIds: string[];
  goalProgress: Record<string, number>; 
  aiAnalysis?: string;
}

export interface AppState {
  habits: Habit[];
  goals: Goal[];
  logs: Record<string, DailyLog>; // date -> log
}