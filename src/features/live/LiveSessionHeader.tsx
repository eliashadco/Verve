import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/Badge';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface LiveSessionHeaderProps {
  programName: string;
  focusLabel?: string | null;
  dayLabel: string;
  isDraft?: boolean;
  /** 0-100 */
  readinessPercent: number;
  heartRate?: number | null;
  elapsedLabel: string;
  isPaused?: boolean;
  paceEnabled?: boolean;
  onBack: () => void;
  onTogglePause: () => void;
  onTogglePace: () => void;
}

export function LiveSessionHeader({
  programName,
  focusLabel,
  dayLabel,
  isDraft,
  readinessPercent,
  heartRate,
  elapsedLabel,
  isPaused,
  paceEnabled,
  onBack,
  onTogglePause,
  onTogglePace,
}: LiveSessionHeaderProps) {
  const readinessColor =
    readinessPercent >= 70 ? colors.primary :
    readinessPercent >= 40 ? colors.accentAmber :
    colors.danger;

  return (
    <View style={styles.root}>
      {/* Top row: Back + Pause | Program title + badges */}
      <View style={styles.topRow}>
        <View style={styles.leftBtns}>
          <Pressable onPress={onBack} style={styles.pillBtn}>
            <Ionicons name="arrow-back" size={14} color={colors.textMain} />
            <Text style={styles.pillBtnText}>Back</Text>
          </Pressable>
          <Pressable onPress={onTogglePause} style={styles.pillBtn}>
            <Ionicons name={isPaused ? 'play' : 'pause'} size={14} color={colors.textMain} />
          </Pressable>
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.program} numberOfLines={1}>{programName}</Text>
          <Badge label="LIVE" />
          {isDraft ? <Badge label="CUSTOM" tone="warning" /> : null}
        </View>
        <Text style={styles.dayLabel}>{focusLabel ? `${focusLabel} · ${dayLabel}` : dayLabel}</Text>
      </View>

      {/* KPI strip */}
      <View style={styles.kpiStrip}>
        {/* Readiness */}
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>READINESS</Text>
          <View style={styles.readinessRow}>
            <View style={styles.readinessTrack}>
              <View style={[styles.readinessFill, { width: `${readinessPercent}%`, backgroundColor: readinessColor }]} />
            </View>
            <Text style={[styles.kpiValue, { color: readinessColor }]}>{readinessPercent}%</Text>
          </View>
        </View>

        <View style={styles.kpiDivider} />

        {/* Heart Rate */}
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>HEART RATE</Text>
          <View style={styles.kpiValueRow}>
            <Ionicons name="heart" size={12} color={colors.danger} />
            <Text style={styles.kpiValue}>{heartRate ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.kpiDivider} />

        {/* Duration */}
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>DURATION</Text>
          <Text style={[styles.kpiValue, styles.kpiMono]}>{elapsedLabel}</Text>
        </View>

        <View style={styles.kpiDivider} />

        {/* Metronome */}
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>METRONOME</Text>
          <Pressable onPress={onTogglePace} style={styles.paceToggle}>
            <Ionicons name="pulse" size={12} color={paceEnabled ? colors.primary : colors.textMuted} />
            <Text style={[styles.kpiValue, { color: paceEnabled ? colors.primary : colors.textMuted }]}>
              {paceEnabled ? 'On' : 'Off'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8, marginBottom: 4 },
  topRow: { gap: 4 },
  leftBtns: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
  },
  pillBtnText: {
    color: colors.textMain,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  program: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.lg,
    flexShrink: 1,
  },
  dayLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },

  /* KPI strip */
  kpiStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  kpiCol: { flex: 1, alignItems: 'center', gap: 3 },
  kpiDivider: { width: 1, height: 24, backgroundColor: colors.borderSubtle },
  kpiLabel: {
    color: colors.textFaint,
    fontFamily: typography.family.bodyBold,
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  kpiValue: {
    color: colors.textStrong,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.sm,
  },
  kpiMono: {
    fontFamily: typography.family.bodyBold,
    letterSpacing: 0.6,
  },
  kpiValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },

  /* Readiness */
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readinessTrack: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderSubtle,
    borderRadius: 2,
    overflow: 'hidden',
  },
  readinessFill: { height: '100%', borderRadius: 2 },

  /* Pace */
  paceToggle: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
