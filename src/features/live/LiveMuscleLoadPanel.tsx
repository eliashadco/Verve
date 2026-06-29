import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface MuscleLoadRow {
  muscle: string;
  /** 0–100 percentage */
  percent: number;
}

interface LiveMuscleLoadPanelProps {
  rows: MuscleLoadRow[];
  totalVolumeKg: number;
}

export function LiveMuscleLoadPanel({ rows, totalVolumeKg }: LiveMuscleLoadPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <GlassCard style={styles.card}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={14} color={colors.accentAmber} />
          <Text style={styles.title}>SESSION LOAD DISTRIBUTION</Text>
          <Text style={styles.branding}>— POWERED BY VERVE ENGINE</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>

      {expanded && (
        <>
          <View style={styles.subRow}>
            <Text style={styles.subtitle}>Updates as sets are logged</Text>
            <Text style={styles.volumeLabel}>Total Volume: <Text style={styles.volumeValue}>{totalVolumeKg.toLocaleString()} kg</Text></Text>
          </View>

          {rows.map((row) => (
            <View key={row.muscle} style={styles.barRow}>
              <Text style={styles.muscleName}>{row.muscle}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, row.percent)}%` }]} />
              </View>
              <Text style={styles.barPct}>{row.percent}%</Text>
            </View>
          ))}
        </>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  title: {
    color: colors.accentAmber,
    fontFamily: typography.family.bodyBold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  branding: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
  volumeLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
  volumeValue: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
  },

  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleName: {
    width: 70,
    color: colors.textSub,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  barPct: {
    width: 32,
    textAlign: 'right',
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
});
