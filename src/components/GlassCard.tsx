/**
 * GlassCard — frosted dark surface used across the dashboards.
 * Translates `.glass-panel` + `.verve-card` from design-system.css.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

import { cardVariants, colors, radii, shadows } from '@/lib/theme';

interface Props extends ViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'accent' | 'glass' | 'hero' | 'stat' | 'anatomy' | 'builder' | 'inline' | 'wearable';
  padding?: number;
}

export function GlassCard({
  children,
  style,
  variant = 'default',
  padding = 16,
  ...rest
}: Props) {
  const variantStyle =
    variant === 'accent'
      ? styles.accent
      : variant === 'glass'
        ? styles.glass
        : variant === 'hero'
          ? styles.hero
          : variant === 'stat'
            ? styles.stat
            : variant === 'anatomy'
              ? styles.anatomy
              : variant === 'builder'
                ? styles.builder
                : variant === 'inline'
                  ? styles.inline
                  : variant === 'wearable'
                    ? styles.wearable
                    : styles.default;

  return (
    <View
      style={[styles.base, variantStyle, { padding }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
  default: {
    backgroundColor: colors.cardBg,
    borderColor: colors.borderDefault,
  },
  accent: {
    backgroundColor: colors.cardBg,
    borderColor: colors.borderAccent,
    ...shadows.glow,
  },
  glass: {
    backgroundColor: colors.surface1,
    borderColor: colors.borderDefault,
  },
  hero: {
    ...cardVariants.heroCard,
    ...shadows.glow,
  },
  stat: {
    ...cardVariants.statCard,
    ...shadows.xs,
  },
  anatomy: {
    ...cardVariants.anatomyMapCard,
    ...shadows.md,
  },
  builder: {
    ...cardVariants.builderMain,
    ...shadows.md,
  },
  inline: {
    ...cardVariants.inlineCard,
    ...shadows.none,
  },
  wearable: {
    ...cardVariants.wearableCard,
    ...shadows.sm,
  },
});
