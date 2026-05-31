import { brand } from './theme';

export interface Category {
  id: string;
  name: string;
  icon: string;
  customIconUri?: string;
  color: string;
  isCustom: boolean;
}

export const STANDARD_CATEGORIES: Category[] = [
  {
    id: 'sport',
    name: 'Sport & Fitness',
    icon: '🏃',
    color: brand.blue,
    isCustom: false,
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    icon: '🧘',
    color: '#9B7ED4',
    isCustom: false,
  },
  {
    id: 'health',
    name: 'Sănătate',
    icon: '💪',
    color: brand.green,
    isCustom: false,
  },
  {
    id: 'learning',
    name: 'Învățare',
    icon: '📖',
    color: '#5CB8D6',
    isCustom: false,
  },
  {
    id: 'nutrition',
    name: 'Nutriție',
    icon: '🍎',
    color: brand.gold,
    isCustom: false,
  },
  {
    id: 'sleep',
    name: 'Somn & Recuperare',
    icon: '😴',
    color: '#6B8EBF',
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
    color: '#E8956B',
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
