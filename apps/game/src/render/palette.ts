export const PALETTE = {
  newsprint: '#ffffff',
  ink: '#111111',
  night: '#0b1022',
  night2: '#141b36',
  sodium: '#ffb547',
  marigold: '#e3a21a',
  agency: '#2f6bff',
  red: '#d2312b',
  saffron: '#f08a24',
  green: '#2e7d4f',
  frozen: '#9cc3ff',
  shadow: 'rgba(5, 8, 20, 0.55)',
} as const;

export const FONTS = {
  headline: '"Playfair Display", Georgia, serif',
  caption: '"Libre Caslon Text", Georgia, serif',
  dateline: '"Special Elite", "Courier New", monospace',
  ui: '"IBM Plex Sans Condensed", "Arial Narrow", sans-serif',
} as const;

export const FONT_FACES: readonly string[] = [
  `900 16px ${FONTS.headline}`,
  `400 16px ${FONTS.dateline}`,
  `700 16px ${FONTS.ui}`,
];
