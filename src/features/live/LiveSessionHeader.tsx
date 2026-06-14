import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/Badge';
import { colors, spacing, typography } from '@/lib/theme';

interface LiveSessionHeaderProps {
  programName: string;
  focusLabel?: string | null;
  dayLabel: string;
  readinessLabel: string;
  heartRateLabel: string;
  elapsedLabel: string;
  onBack: () => void;
  onTogglePace: () => void;
}

export function LiveSessionHeader({
  programName,
  focusLabel,
  dayLabel,
  readinessLabel,
  heartRateLabel,
  elapsedLabel,
  onBack,
  onTogglePace,
}: LiveSessionHeaderProps) {
  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} style={styles.inlineBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
          <Text style={styles.inlineBtnText}>Back</Text>
        </Pressable>
        <View style={styles.rightTop}>
          <Badge label="LIVE" />
          <Pressable onPress={onTogglePace} style={styles.inlineBtn}>
            <Ionicons name="pulse-outline" size={16} color={colors.textMuted} />
            <Text style={styles.inlineBtnText}>Pace</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.program}>{programName}</Text>
      <Text style={styles.meta}>{focusLabel ? `${focusLabel} · ${dayLabel}` : dayLabel}</Text>
      <View style={styles.kpis}>
        <Text style={styles.kpi}>{readinessLabel}</Text>
        <Text style={styles.kpi}>{heartRateLabel}</Text>
        <Text style={styles.kpi}>{elapsedLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rightTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  inlineBtnText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  program: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xl,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  kpis: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  kpi: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.label,
  },
});
