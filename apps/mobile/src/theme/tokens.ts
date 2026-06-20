// DARK + LIME design system — single source of truth for all screens.
// Do NOT hardcode hexes in screens; import from here.

export const colors = {
  bg: '#0E0F0C',
  surface: '#1B1D17',
  raised: '#23261E', // raised cards / input backgrounds
  input: '#23261E',
  border: '#2C2F26',
  accent: '#D2F34C', // lime
  onAccent: '#13150C', // dark text on lime
  text: '#F5F7F0',
  muted: '#9BA08D',
  gold: '#F4C430',

  // Status colors tuned for the dark surface
  success: '#7BE08A',
  warning: '#F4C430',
  danger: '#FF6B5E',
  info: '#7FB7FF',

  // Common helpers
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const font = {
  // Loaded in App.tsx via @expo-google-fonts/space-grotesk.
  // Falls back to system font automatically if loading fails.
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  bold: 'SpaceGrotesk_700Bold',
  // Display = headings / car names
  display: 'SpaceGrotesk_700Bold',
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 34,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  raised: {
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  accent: {
    shadowColor: '#D2F34C',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;

export const tokens = { colors, spacing, radius, font, shadow };
export default tokens;
