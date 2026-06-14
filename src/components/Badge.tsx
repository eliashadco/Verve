import { StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { colors, radii, typography } from '@/lib/theme';

type Tone = 'primary' | 'clinical' | 'warning' | 'danger' | 'neutral' | 'success';

interface Props {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
}

export function Badge({ label, tone = 'primary', style }: Props) {
  const palette = palettes[tone];
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const palettes: Record<Tone, { bg: string; border: string; text: string }> = {
  primary:  { bg: colors.primaryDim,   border: colors.primaryBorder,   text: colors.primary },
  clinical: { bg: colors.clinicalDim,  border: colors.clinicalBorder,  text: colors.clinical },
  warning:  { bg: colors.warningDim,   border: 'rgba(245,158,11,0.35)', text: colors.warning },
  danger:   { bg: colors.dangerDim,    border: colors.dangerBorder,    text: colors.danger },
  neutral:  { bg: colors.surface2,     border: colors.borderDefault,   text: colors.textMuted },
  success:  { bg: colors.successDim,    border: 'rgba(34, 197, 94, 0.35)', text: colors.success },
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.bodyBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
