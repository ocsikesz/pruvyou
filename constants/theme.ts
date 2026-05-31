// ─── PruvYou Brand Colors ──────────────────────────────────────────
// Primary:  #1A4F8A  (deep blue)
// Success:  #34C79F  (teal green)
// Accent:   #F7C602  (vibrant gold)

export const brand = {
  blue: '#1A4F8A',
  blueDark: '#153F6E',
  blueLight: '#2563A8',
  green: '#34C79F',
  greenDark: '#28A080',
  greenLight: '#4FD4B0',
  gold: '#F7C602',
  goldDark: '#D4A900',
  goldLight: '#FFD83D',
};

export const colors = {
  // Backgrounds — dark with subtle blue tint
  bg: '#0D1219',
  bgCard: '#141C27',
  bgCardHover: '#1A2535',
  border: '#1E2A3A',
  borderLight: '#263548',

  // Brand colors
  primary: brand.blue,
  success: brand.green,
  accent: brand.gold,

  // Text
  text: '#E4E8EE',
  textMuted: '#B0BACA',
  textDim: '#7889A0',
  textDark: '#4D5E74',
  textDarkest: '#354560',

  // Semantic
  green: brand.green,
  yellow: brand.gold,
  orange: '#E8956B',
  red: '#E88B8B',
  blue: brand.blue,
  purple: '#9B7ED4',
  teal: '#5CB8D6',
  brown: '#C49A6C',
  greenLight: '#4FD4B0',
  pinkLight: '#D4A0C9',
};

export const PALETTE = [
  brand.blue,
  brand.green,
  brand.gold,
  '#E8956B',
  '#9B7ED4',
  '#5CB8D6',
  '#E88B8B',
  '#C49A6C',
  '#4FD4B0',
  '#D4A0C9',
];

export const ICONS = ['🏃','🧘','💪','📖','🧠','💧','🍎','😴','✍️','🎯','⏰','🔥','🌿','🎵','📝'];

export const DAYS_RO = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

export const MONTHS_RO = [
  'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
  'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie',
];

export function getCompletionColor(ratio: number): string {
  if (ratio >= 1) return brand.green;
  if (ratio >= 0.7) return brand.gold;
  if (ratio >= 0.4) return '#E8956B';
  return colors.textDark;
}
