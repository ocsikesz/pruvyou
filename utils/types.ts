export interface Habit {
  id: string;
  name: string;
  icon: string;
  type: 'check' | 'timer';
  frequency: 'daily' | 'weekly';
  targetMinutes: number;
  weeklyTarget: number;
  color: string;
  categoryId: string;
}

export interface LogEntry {
  done: boolean;
  minutes?: number;
}

export type DayLog = Record<string, LogEntry>;       // habitId -> LogEntry
export type HabitLog = Record<string, DayLog>;        // dateStr -> DayLog
