// ─── PruvYou Brand Colors ──────────────────────────────────────────
export const brand = {
  blue: '#1A4F8A',
  green: '#34C79F',
  gold: '#F7C602',
};

export const colors = {
  bg: '#F5F7FA',
  white: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgCardHover: '#F0F3F8',
  border: '#E0E4EA',
  borderLight: '#EDF0F5',

  primary: brand.blue,
  success: brand.green,
  accent: brand.gold,

  text: '#1A2E44',
  textMuted: '#4D5E74',
  textDim: '#7889A0',
  textDark: '#A0AEBC',
  textLight: '#B0BACA',

  green: brand.green,
  yellow: brand.gold,
  orange: '#E8956B',
  red: '#E88B8B',
  blue: brand.blue,
  purple: '#9B7ED4',
  teal: '#5CB8D6',

  // Category card backgrounds
  greenBg: '#E8F8F0', greenBorder: '#B8E6D0',
  blueBg: '#E6EFF8', blueBorder: '#B0CDE8',
  goldBg: '#FEF8E6', goldBorder: '#F5DFA0',
  purpleBg: '#F0EDFE', purpleBorder: '#C8C4E8',
  tealBg: '#E1F5EE', tealBorder: '#9FE1CB',
  pinkBg: '#FBEAF0', pinkBorder: '#F4C0D1',
};

export const PALETTE = [brand.blue, brand.green, brand.gold, '#E8956B', '#9B7ED4', '#5CB8D6', '#E88B8B', '#C49A6C'];
export const ICONS = ['🏃','🧘','💪','📖','🧠','💧','🍎','😴','✍️','🎯','⏰','🔥','🌿','🎵','📝'];
export const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function getCompletionColor(ratio: number): string {
  if (ratio >= 1) return brand.green;
  if (ratio >= 0.7) return brand.gold;
  if (ratio >= 0.4) return '#E8956B';
  return colors.textDark;
}
