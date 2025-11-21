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
  goalProgress: Record<string, number>; // goalId -> value added today (incremental) OR total (snapshot)? Let's do snapshot for simplicity in this MVP or incremental. Let's stick to current absolute value in Goal object, but maybe log for history.
  // For simplicity, we will track current goal progress in the Goal object itself, 
  // and just use DailyLog to track if habits were done that day.
  aiAnalysis?: string;
}

export interface AppState {
  habits: Habit[];
  goals: Goal[];
  logs: Record<string, DailyLog>; // date -> log
}