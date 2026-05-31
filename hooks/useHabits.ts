import { useState, useEffect, useCallback } from 'react';
import { load, save } from '@/utils/storage';
import { clamp } from '@/utils/dates';
import type { Habit, HabitLog } from '@/utils/types';
import type { Category } from '@/constants/categories';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [log, setLog] = useState<HabitLog>({});
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const h = await load<Habit[]>('ht-habits', []);
      const l = await load<HabitLog>('ht-log', {});
      const cc = await load<Category[]>('ht-custom-categories', []);
      setHabits(h);
      setLog(l);
      setCustomCategories(cc);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) save('ht-habits', habits);
  }, [habits, loaded]);

  useEffect(() => {
    if (loaded) save('ht-log', log);
  }, [log, loaded]);

  useEffect(() => {
    if (loaded) save('ht-custom-categories', customCategories);
  }, [customCategories, loaded]);

  const addHabit = useCallback((h: Omit<Habit, 'id'>) => {
    setHabits(prev => [...prev, { ...h, id: Date.now().toString() }]);
  }, []);

  const updateHabit = useCallback((h: Habit) => {
    setHabits(prev => prev.map(x => x.id === h.id ? h : x));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(x => x.id !== id));
  }, []);

  const toggleDay = useCallback((habitId: string, dateStr: string) => {
    setLog(prev => {
      const copy = { ...prev };
      if (!copy[dateStr]) copy[dateStr] = {};
      const cur = copy[dateStr][habitId];
      copy[dateStr] = { ...copy[dateStr], [habitId]: { done: !cur?.done, minutes: cur?.minutes } };
      return copy;
    });
  }, []);

  const addMinutes = useCallback((habitId: string, dateStr: string, delta: number, target: number) => {
    setLog(prev => {
      const copy = { ...prev };
      if (!copy[dateStr]) copy[dateStr] = {};
      const cur = copy[dateStr][habitId]?.minutes || 0;
      const next = clamp(cur + delta, 0, 999);
      copy[dateStr] = { ...copy[dateStr], [habitId]: { done: next >= target, minutes: next } };
      return copy;
    });
  }, []);

  const addCustomCategory = useCallback((cat: Category) => {
    setCustomCategories(prev => [...prev, cat]);
  }, []);

  const deleteCustomCategory = useCallback((id: string) => {
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    habits, log, loaded,
    customCategories,
    addHabit, updateHabit, deleteHabit,
    toggleDay, addMinutes,
    addCustomCategory, deleteCustomCategory,
  };
}
