import { brand, colors } from './theme';

export interface Category {
  id: string;
  name: string;
  icon: string;
  customIconUri?: string;
  color: string;
  bg: string;
  border: string;
  isCustom: boolean;
}

export const STANDARD_CATEGORIES: Category[] = [
  { id: 'sport', name: 'Sport & Fitness', icon: '🏃', color: brand.blue, bg: colors.blueBg, border: colors.blueBorder, isCustom: false },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', color: '#9B7ED4', bg: colors.purpleBg, border: colors.purpleBorder, isCustom: false },
  { id: 'health', name: 'Health', icon: '💪', color: brand.green, bg: colors.greenBg, border: colors.greenBorder, isCustom: false },
  { id: 'learning', name: 'Learning', icon: '📖', color: '#5CB8D6', bg: colors.tealBg, border: colors.tealBorder, isCustom: false },
  { id: 'nutrition', name: 'Nutrition', icon: '🍎', color: brand.gold, bg: colors.goldBg, border: colors.goldBorder, isCustom: false },
  { id: 'sleep', name: 'Sleep & Recovery', icon: '😴', color: '#6B8EBF', bg: colors.blueBg, border: colors.blueBorder, isCustom: false },
  { id: 'creativity', name: 'Creativity', icon: '✍️', color: '#D4689B', bg: colors.pinkBg, border: colors.pinkBorder, isCustom: false },
  { id: 'productivity', name: 'Productivity', icon: '🎯', color: '#E8956B', bg: colors.goldBg, border: colors.goldBorder, isCustom: false },
];

export function getCategoryById(id: string, customCategories: Category[] = []): Category | undefined {
  return STANDARD_CATEGORIES.find(c => c.id === id) || customCategories.find(c => c.id === id);
}

export function getAllCategories(customCategories: Category[] = []): Category[] {
  return [...STANDARD_CATEGORIES, ...customCategories];
}
