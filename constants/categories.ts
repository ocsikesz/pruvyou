import { colors } from './theme';

export interface Category {
  id: string;
  name: string;
  icon: string;          // emoji for standard, or 'custom'
  customIconUri?: string; // local URI for custom uploaded icon
  color: string;
  isCustom: boolean;
}

// ─── Standard Categories ───────────────────────────────────────────
export const STANDARD_CATEGORIES: Category[] = [
  {
    id: 'sport',
    name: 'Sport & Fitness',
    icon: '🏃',
    color: '#E8956B',
    isCustom: false,
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    icon: '🧘',
    color: '#C9A8E0',
    isCustom: false,
  },
  {
    id: 'health',
    name: 'Sănătate',
    icon: '💪',
    color: '#7BC9A0',
    isCustom: false,
  },
  {
    id: 'learning',
    name: 'Învățare',
    icon: '📖',
    color: '#A8C5E0',
    isCustom: false,
  },
  {
    id: 'nutrition',
    name: 'Nutriție',
    icon: '🍎',
    color: '#E8C96B',
    isCustom: false,
  },
  {
    id: 'sleep',
    name: 'Somn & Recuperare',
    icon: '😴',
    color: '#8BC9E8',
    isCustom: false,
  },
  {
    id: 'creativity',
    name: 'Creativitate',
    icon: '✍️',
    color: '#D4A0C9',
    isCustom: false,
  },
  {
    id: 'productivity',
    name: 'Productivitate',
    icon: '🎯',
    color: '#D4A574',
    isCustom: false,
  },
];

export function getCategoryById(
  id: string,
  customCategories: Category[] = []
): Category | undefined {
  return (
    STANDARD_CATEGORIES.find(c => c.id === id) ||
    customCategories.find(c => c.id === id)
  );
}

export function getAllCategories(customCategories: Category[] = []): Category[] {
  return [...STANDARD_CATEGORIES, ...customCategories];
}
