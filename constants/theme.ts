export const colors = {
  bg: '#1a1714',
  bgCard: '#222018',
  bgCardHover: '#2a2520',
  border: '#2a2520',
  borderLight: '#3a3428',

  gold: '#d4a574',
  goldDark: '#c8956a',
  text: '#e8e0d4',
  textMuted: '#c8bca8',
  textDim: '#8a7e6e',
  textDark: '#6a5e4e',
  textDarkest: '#4a4438',

  green: '#7BC9A0',
  greenDark: '#5ba880',
  yellow: '#E8C96B',
  orange: '#E8956B',
  red: '#E88B8B',
  blue: '#A8C5E0',
  purple: '#C9A8E0',
  teal: '#8BC9E8',
  brown: '#D4A574',
  greenLight: '#A0D4A0',
  pinkLight: '#D4A0C9',
};

export const PALETTE = [
  colors.orange, colors.blue, colors.purple, colors.green, colors.yellow,
  colors.red, colors.teal, colors.brown, colors.greenLight, colors.pinkLight,
];

export const ICONS = ['🏃','🧘','💪','📖','🧠','💧','🍎','😴','✍️','🎯','⏰','🔥','🌿','🎵','📝'];

export const DAYS_RO = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

export const MONTHS_RO = [
  'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
  'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie',
];

export function getCompletionColor(ratio: number): string {
  if (ratio >= 1) return colors.green;
  if (ratio >= 0.7) return colors.yellow;
  if (ratio >= 0.4) return colors.orange;
  return colors.textDark;
}
