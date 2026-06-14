/**
 * VerveButton — primary CTA + ghost variants.
 * Translates `.btn-verve` and `.btn-ghost` from design-system.css.
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PressableProps, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors, radii, shadows, typography } from '@/lib/theme';

type Variant = 'primary' | 'ghost' | 'danger';

interface Props extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function VerveButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  leftIcon,
  fullWidth = true,
  size = 'md',
  style,
  ...rest
}: Props) {
  const handlePress = () => {
    if (loading || disabled) return;
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };

  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle.container,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color as string} />
      ) : (
        <View style={styles.row}>
          {leftIcon}
          <Text style={[styles.text, sizeStyle.text, variantStyle.text]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: {
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
    letterSpacing: 0.2,
  },
});

const sizeStyles: Record<'sm' | 'md' | 'lg', { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
    text: { fontSize: typography.size.sm },
  },
  md: {
    container: { paddingVertical: 12, paddingHorizontal: 18, minHeight: 46 },
    text: { fontSize: typography.size.base },
  },
  lg: {
    container: { paddingVertical: 16, paddingHorizontal: 22, minHeight: 54 },
    text: { fontSize: typography.size.md },
  },
};

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      ...shadows.glow,
    },
    text: { color: colors.white },
  },
  ghost: {
    container: {
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.borderDefault,
    },
    text: { color: colors.textSub },
  },
  danger: {
    container: {
      backgroundColor: colors.dangerDim,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
    },
    text: { color: colors.danger },
  },
};
