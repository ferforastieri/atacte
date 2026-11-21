import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Single source of truth for the mobile design language.
 * Mirrors the semantic tokens used by the web manager (phase 1).
 * No other file should declare a color literal.
 */

export interface ThemeColors {
  canvas: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  inkInverse: string;
  line: string;
  lineStrong: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  primarySoft: string;
  primarySoftBorder: string;
  primarySoftText: string;
  accent: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  successBorder: string;
  successText: string;
  warning: string;
  warningSoft: string;
  warningBorder: string;
  warningText: string;
  danger: string;
  dangerSolid: string;
  dangerSoft: string;
  dangerBorder: string;
  dangerText: string;
  info: string;
  infoSoft: string;
  infoBorder: string;
  infoText: string;
  scrim: string;
  shadow: string;
  overlaySoft: string;
  hero: string;
  heroRaised: string;
  heroBorder: string;
  heroText: string;
  heroMuted: string;
  heroGlow: string;
  heroBar: string;
}

const palette = {
  primary50: '#f0fdf4',
  primary100: '#dcfce7',
  primary200: '#bbf7d0',
  primary300: '#86efac',
  primary400: '#4ade80',
  primary500: '#22c55e',
  primary600: '#16a34a',
  primary700: '#15803d',
  primary800: '#166534',
  primary900: '#14532d',
  primary950: '#052e16',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  slate950: '#020617',
  emerald500: '#10b981',
  emerald700: '#047857',
  emerald900: '#064e3b',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',
  amber900: '#78350f',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',
  red900: '#7f1d1d',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  blue900: '#1e3a8a',
  white: '#ffffff',
  black: '#000000',
} as const;

export const lightColors: ThemeColors = {
  canvas: palette.slate50,
  surface: palette.white,
  surfaceMuted: palette.slate100,
  surfaceRaised: palette.white,
  ink: palette.slate900,
  inkMuted: palette.slate600,
  inkSubtle: '#5b6b80',
  inkInverse: palette.slate50,
  line: palette.slate200,
  lineStrong: palette.slate300,
  primary: palette.primary700,
  primaryHover: palette.primary800,
  primaryText: palette.primary700,
  primarySoft: palette.primary50,
  primarySoftBorder: palette.primary200,
  primarySoftText: palette.primary700,
  accent: palette.primary500,
  onPrimary: palette.white,
  success: palette.emerald500,
  successSoft: '#ecfdf5',
  successBorder: '#a7f3d0',
  successText: palette.emerald700,
  warning: palette.amber600,
  warningSoft: '#fffbeb',
  warningBorder: '#fde68a',
  warningText: palette.amber700,
  danger: palette.red600,
  dangerSolid: palette.red600,
  dangerSoft: '#fef2f2',
  dangerBorder: '#fecaca',
  dangerText: palette.red700,
  info: palette.blue600,
  infoSoft: '#eff6ff',
  infoBorder: '#bfdbfe',
  infoText: palette.blue700,
  scrim: 'rgba(2, 6, 23, 0.55)',
  shadow: palette.slate950,
  overlaySoft: 'rgba(15, 23, 42, 0.06)',
  hero: palette.slate900,
  heroRaised: palette.slate800,
  heroBorder: 'rgba(255, 255, 255, 0.10)',
  heroText: palette.slate50,
  heroMuted: palette.slate400,
  heroGlow: 'rgba(34, 197, 94, 0.18)',
  heroBar: 'rgba(255, 255, 255, 0.12)',
};

export const darkColors: ThemeColors = {
  ...lightColors,
  canvas: palette.slate950,
  surface: palette.slate900,
  surfaceMuted: palette.slate800,
  surfaceRaised: '#14202f',
  ink: '#f1f5f9',
  inkMuted: palette.slate400,
  inkSubtle: palette.slate400,
  inkInverse: palette.slate900,
  line: palette.slate700,
  lineStrong: '#475569',
  primary: palette.primary700,
  primaryHover: palette.primary800,
  primaryText: palette.primary400,
  primarySoft: palette.primary950,
  primarySoftBorder: palette.primary900,
  primarySoftText: palette.primary300,
  success: '#34d399',
  successSoft: palette.emerald900,
  successBorder: '#065f46',
  successText: '#6ee7b7',
  warning: '#fbbf24',
  warningSoft: palette.amber900,
  warningBorder: '#92400e',
  warningText: '#fcd34d',
  danger: '#f87171',
  dangerSolid: palette.red700,
  dangerSoft: palette.red900,
  dangerBorder: '#991b1b',
  dangerText: '#fca5a5',
  info: '#60a5fa',
  infoSoft: palette.blue900,
  infoBorder: '#1e40af',
  infoText: '#93c5fd',
  scrim: 'rgba(0, 0, 0, 0.70)',
  shadow: palette.black,
  overlaySoft: 'rgba(255, 255, 255, 0.06)',
};

export const getColors = (isDark: boolean): ThemeColors => (isDark ? darkColors : lightColors);

export const radii = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  screen: 20,
} as const;

export const typography = {
  caption: 11,
  label: 12,
  body: 14,
  bodyLarge: 16,
  title: 18,
  headline: 22,
  display: 28,
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },
} as const;

export const shadows = {
  card: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  } as ViewStyle,
  pop: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 12,
  } as ViewStyle,
  hero: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 36,
    elevation: 14,
  } as ViewStyle,
} as const;

export const touch = {
  minimum: 44,
} as const;

export const theme = {
  lightColors,
  darkColors,
  colors: lightColors,
  radii,
  spacing,
  typography,
  shadows,
  touch,
} as const;

export default theme;
