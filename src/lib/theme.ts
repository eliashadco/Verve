/**
 * Verve Theme — TypeScript port of verve-app/css/design-system.css
 *
 * Single source of truth for colors, typography, radii, shadows, spacing.
 * Mirrors the web design system so designs stay 1:1 with the HTML POCs.
 */

import { StyleSheet } from 'react-native';

const registeredStylesheets: any[] = [];

// Override StyleSheet.create to return plain objects so getters are evaluated on access (i.e. during render)
const originalCreate = StyleSheet.create;
StyleSheet.create = ((styles: any) => {
  registeredStylesheets.push(styles);
  return styles;
}) as any;

export const colors = {
  // Brand
  primary: '#10B981',
  primaryHover: '#059669',
  primaryDim: 'rgba(16, 185, 129, 0.16)',
  primaryGlow: 'rgba(16, 185, 129, 0.28)',
  primaryBorder: 'rgba(16, 185, 129, 0.30)',
  primaryBorderStrong: 'rgba(16, 185, 129, 0.50)',

  // Clinical accent
  clinical: '#06b6d4',
  clinicalDim: 'rgba(6, 182, 212, 0.10)',
  clinicalBorder: 'rgba(6, 182, 212, 0.30)',

  // Accents
  accentCyan: '#2dd4ff',
  accentBlue: '#60a5fa',
  accentAmber: '#fbbf24',
  accentRose: '#fb7185',
  secondary: '#3B82F6',

  // Status
  success: '#22c55e',
  successDim: 'rgba(34, 197, 94, 0.15)',
  warning: '#f59e0b',
  warningDim: 'rgba(245, 158, 11, 0.15)',
  danger: '#ef4444',
  dangerDim: 'rgba(239, 68, 68, 0.15)',
  dangerBorder: 'rgba(239, 68, 68, 0.35)',

  // Backgrounds
  bgApp: '#020408',
  bgSurface: '#0f172a',
  bgElevated: '#1a2436',

  // Glass / surface alpha
  surface1: 'rgba(30, 41, 59, 0.40)',
  surface2: 'rgba(15, 23, 42, 0.60)',
  surface3: 'rgba(15, 23, 42, 0.80)',
  surface4: 'rgba(15, 23, 42, 0.92)',
  surfaceHover: 'rgba(255, 255, 255, 0.06)',
  surfaceActive: 'rgba(16, 185, 129, 0.14)',

  // Text
  textMain: '#F8FAFC',
  textStrong: '#FFFFFF',
  textSub: '#E2E8F0',
  textSoft: 'rgba(226, 232, 240, 0.86)',
  textMuted: '#94A3B8',
  textFaint: '#64748B',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderDefault: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  borderMuted: 'rgba(71, 85, 105, 0.30)',
  borderAccent: 'rgba(16, 185, 129, 0.22)',
  borderAccentStrong: 'rgba(16, 185, 129, 0.40)',

  // Cards
  cardBg: 'rgba(15, 23, 42, 0.95)',
  cardBgHover: 'rgba(30, 41, 59, 1)',
  cardProBg: 'rgba(8, 13, 28, 0.92)',
  cardProBorder: 'rgba(255, 255, 255, 0.10)',
  cardProInset: 'rgba(255, 255, 255, 0.04)',
  statCardBg: 'rgba(12, 21, 39, 0.88)',
  heroCardBg: 'rgba(7, 15, 31, 0.96)',
  anatomyCardBg: 'rgba(5, 12, 24, 0.94)',
  builderCardBg: 'rgba(8, 18, 33, 0.96)',

  /** Teal glass ambient + overview shells (User trial.html parity) */
  ambientTealDeep: '#031018',
  ambientTealMid: '#061e24',
  ambientTealGlow: 'rgba(6, 182, 212, 0.14)',
  ambientMintWash: 'rgba(16, 185, 129, 0.08)',
  glassGlanceSurface: 'rgba(15, 23, 42, 0.55)',
  glassGlanceBorder: 'rgba(71, 85, 105, 0.3)',
  notificationProtocolBg: 'rgba(16, 185, 129, 0.14)',
  notificationProtocolBorder: 'rgba(16, 185, 129, 0.35)',
  notificationProtocolIconBg: 'rgba(16, 185, 129, 0.22)',
  countdownChipBg: 'rgba(16, 185, 129, 0.1)',
  countdownChipBorder: 'rgba(16, 185, 129, 0.3)',
  thisWeekStreakBg: 'rgba(251, 146, 60, 0.08)',
  thisWeekStreakBorder: 'rgba(251, 146, 60, 0.22)',

  // Transparent helpers
  black: '#000000',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const gradients = {
  primary: ['#10B981', '#06b6d4'] as const,
  brand: ['#34D399', '#22D3EE'] as const,
  dark: ['#0b1224', '#0a162e'] as const,
  panelHero: ['#0b1224', '#0a162e', '#081426'] as const,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/**
 * iOS shadow + Android elevation in one helper.
 * Matches the depth tokens from design-system.css.
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 35,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 45,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  glow: {
    shadowColor: '#10B981',
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
} as const;

export const typography = {
  family: {
    body: 'PlusJakartaSans_400Regular',
    bodyMedium: 'PlusJakartaSans_500Medium',
    bodySemi: 'PlusJakartaSans_600SemiBold',
    bodyBold: 'PlusJakartaSans_700Bold',
    heading: 'Outfit_700Bold',
    headingSemi: 'Outfit_600SemiBold',
    headingExtra: 'Outfit_800ExtraBold',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  lineHeight: {
    tight: 1.2,
    base: 1.5,
    relaxed: 1.6,
  },
  letterSpacing: {
    tight: -0.4,
    normal: 0,
    wide: 0.5,
    label: 1,
  },
} as const;

export const layout = {
  tabBarHeight: 72,
  headerHeight: 56,
  screenPad: 16,
  cardPad: 16,
} as const;

export const cardVariants = {
  glassPanel: {
    backgroundColor: colors.surface1,
    borderColor: colors.borderDefault,
    borderRadius: radii.lg,
  },
  statCard: {
    backgroundColor: colors.statCardBg,
    borderColor: colors.cardProBorder,
    borderRadius: radii.lg,
  },
  heroCard: {
    backgroundColor: colors.heroCardBg,
    borderColor: colors.primaryBorder,
    borderRadius: radii.xl,
  },
  wearableCard: {
    backgroundColor: colors.cardProBg,
    borderColor: colors.clinicalBorder,
    borderRadius: radii.xl,
  },
  anatomyMapCard: {
    backgroundColor: colors.anatomyCardBg,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
  },
  builderMain: {
    backgroundColor: colors.builderCardBg,
    borderColor: colors.primaryBorder,
    borderRadius: radii.xl,
  },
  inlineCard: {
    backgroundColor: colors.surface2,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
  },
} as const;

/**
 * Single object exported as `theme` for places that prefer one import.
 */
export const theme = {
  colors,
  gradients,
  radii,
  spacing,
  shadows,
  typography,
  layout,
  cardVariants,
};

export type Theme = typeof theme;

const listeners = new Set<() => void>();

export function addThemeListener(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function updateTheme(mode: 'dark' | 'light', accent: string) {
  const oldColors = { ...colors };
  const newColors = getColorsForTheme(mode, accent);

  // 1. Update colors object properties in-place
  Object.keys(newColors).forEach((key) => {
    (colors as any)[key] = (newColors as any)[key];
  });

  // 2. Update all registered stylesheets in-place
  registeredStylesheets.forEach((stylesheet) => {
    Object.keys(stylesheet).forEach((styleKey) => {
      const styleObj = stylesheet[styleKey];
      if (styleObj && typeof styleObj === 'object') {
        Object.keys(styleObj).forEach((propKey) => {
          const val = styleObj[propKey];
          if (typeof val === 'string') {
            Object.keys(oldColors).forEach((colorKey) => {
              const oldVal = (oldColors as any)[colorKey];
              if (val === oldVal) {
                // Avoid incorrect mappings between textStrong (#FFFFFF) and white (#FFFFFF)
                if (colorKey === 'white' && propKey === 'color') return;
                if (colorKey === 'textStrong' && propKey !== 'color') return;
                styleObj[propKey] = (newColors as any)[colorKey];
              }
            });
          }
        });
      }
    });
  });

  listeners.forEach((l) => l());
}

export function getColorsForTheme(mode: 'dark' | 'light', accent: string) {
  const isDark = mode !== 'light';
  
  // Base primary colors based on accent
  let primary = '#10B981';
  let primaryHover = '#059669';
  let primaryDim = 'rgba(16, 185, 129, 0.16)';
  let primaryGlow = 'rgba(16, 185, 129, 0.28)';
  let primaryBorder = 'rgba(16, 185, 129, 0.30)';
  let primaryBorderStrong = 'rgba(16, 185, 129, 0.50)';

  if (accent === 'cyan') {
    primary = '#06b6d4';
    primaryHover = '#0891b2';
    primaryDim = 'rgba(6, 182, 212, 0.16)';
    primaryGlow = 'rgba(6, 182, 212, 0.28)';
    primaryBorder = 'rgba(6, 182, 212, 0.30)';
    primaryBorderStrong = 'rgba(6, 182, 212, 0.50)';
  } else if (accent === 'amber') {
    primary = '#fb923c';
    primaryHover = '#ea580c';
    primaryDim = 'rgba(251, 146, 60, 0.16)';
    primaryGlow = 'rgba(251, 146, 60, 0.28)';
    primaryBorder = 'rgba(251, 146, 60, 0.30)';
    primaryBorderStrong = 'rgba(251, 146, 60, 0.50)';
  }

  const bgApp = isDark ? '#020408' : '#F8FAFC';
  const bgSurface = isDark ? '#0f172a' : '#ffffff';
  const bgElevated = isDark ? '#1a2436' : '#f1f5f9';

  const textMain = isDark ? '#F8FAFC' : '#0F172A';
  const textStrong = isDark ? '#FFFFFF' : '#000000';
  const textSub = isDark ? '#E2E8F0' : '#334155';
  const textSoft = isDark ? 'rgba(226, 232, 240, 0.86)' : 'rgba(15, 23, 42, 0.86)';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const textFaint = isDark ? '#64748B' : '#94A3B8';

  const surface1 = isDark ? 'rgba(30, 41, 59, 0.40)' : 'rgba(226, 232, 240, 0.40)';
  const surface2 = isDark ? 'rgba(15, 23, 42, 0.60)' : 'rgba(241, 245, 249, 0.60)';
  const surface3 = isDark ? 'rgba(15, 23, 42, 0.80)' : 'rgba(241, 245, 249, 0.80)';
  const surface4 = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(241, 245, 249, 0.92)';
  const surfaceHover = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const surfaceActive = isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.08)';

  const borderSubtle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const borderDefault = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const borderStrong = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)';
  const borderMuted = isDark ? 'rgba(71, 85, 105, 0.30)' : 'rgba(148, 163, 184, 0.30)';

  return {
    primary,
    primaryHover,
    primaryDim,
    primaryGlow,
    primaryBorder,
    primaryBorderStrong,

    clinical: '#06b6d4',
    clinicalDim: isDark ? 'rgba(6, 182, 212, 0.10)' : 'rgba(6, 182, 212, 0.06)',
    clinicalBorder: isDark ? 'rgba(6, 182, 212, 0.30)' : 'rgba(6, 182, 212, 0.20)',

    accentCyan: '#2dd4ff',
    accentBlue: '#60a5fa',
    accentAmber: '#fbbf24',
    accentRose: '#fb7185',
    secondary: '#3B82F6',

    success: '#22c55e',
    successDim: 'rgba(34, 197, 94, 0.15)',
    warning: '#f59e0b',
    warningDim: 'rgba(245, 158, 11, 0.15)',
    danger: '#ef4444',
    dangerDim: 'rgba(239, 68, 68, 0.15)',
    dangerBorder: 'rgba(239, 68, 68, 0.35)',

    bgApp,
    bgSurface,
    bgElevated,

    surface1,
    surface2,
    surface3,
    surface4,
    surfaceHover,
    surfaceActive,

    textMain,
    textStrong,
    textSub,
    textSoft,
    textMuted,
    textFaint,

    borderSubtle,
    borderDefault,
    borderStrong,
    borderMuted,
    borderAccent: `rgba(${accent === 'cyan' ? '6, 182, 212' : accent === 'amber' ? '251, 146, 60' : '16, 185, 129'}, 0.22)`,
    borderAccentStrong: `rgba(${accent === 'cyan' ? '6, 182, 212' : accent === 'amber' ? '251, 146, 60' : '16, 185, 129'}, 0.40)`,

    cardBg: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    cardBgHover: isDark ? 'rgba(30, 41, 59, 1)' : 'rgba(241, 245, 249, 1)',
    cardProBg: isDark ? 'rgba(8, 13, 28, 0.92)' : 'rgba(240, 249, 255, 0.92)',
    cardProBorder: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)',
    cardProInset: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
    statCardBg: isDark ? 'rgba(12, 21, 39, 0.88)' : 'rgba(240, 253, 250, 0.88)',
    heroCardBg: isDark ? 'rgba(7, 15, 31, 0.96)' : 'rgba(240, 253, 244, 0.96)',
    anatomyCardBg: isDark ? 'rgba(5, 12, 24, 0.94)' : 'rgba(245, 243, 255, 0.94)',
    builderCardBg: isDark ? 'rgba(8, 18, 33, 0.96)' : 'rgba(239, 246, 255, 0.96)',

    ambientTealDeep: isDark ? '#031018' : '#f0fdfa',
    ambientTealMid: isDark ? '#061e24' : '#ccfbf1',
    ambientTealGlow: isDark ? 'rgba(6, 182, 212, 0.14)' : 'rgba(6, 182, 212, 0.08)',
    ambientMintWash: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
    glassGlanceSurface: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.55)',
    glassGlanceBorder: isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.3)',
    notificationProtocolBg: isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.08)',
    notificationProtocolBorder: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.20)',
    notificationProtocolIconBg: isDark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.14)',
    countdownChipBg: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
    countdownChipBorder: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.20)',
    thisWeekStreakBg: isDark ? 'rgba(251, 146, 60, 0.08)' : 'rgba(254, 215, 170, 0.08)',
    thisWeekStreakBorder: isDark ? 'rgba(251, 146, 60, 0.22)' : 'rgba(254, 215, 170, 0.22)',

    black: '#000000',
    white: '#FFFFFF',
    transparent: 'transparent',
  };
}
