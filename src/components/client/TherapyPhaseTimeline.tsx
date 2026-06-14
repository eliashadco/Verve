import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, typography } from '@/lib/theme';

interface TherapyPhaseTimelineProps {
  phases: { label: string; state: 'done' | 'active' | 'upcoming' }[];
}

export function TherapyPhaseTimeline({ phases }: TherapyPhaseTimelineProps) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>Pathway Roadmap</Text>
      {phases.map((phase, index) => (
        <View key={`${phase.label}-${index}`} style={styles.row}>
          <View style={[styles.dot, dotTone[phase.state]]} />
          <Text style={styles.label}>{phase.label}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

const dotTone = StyleSheet.create({
  done: { backgroundColor: colors.success },
  active: { backgroundColor: colors.primary },
  upcoming: { backgroundColor: colors.textFaint },
});

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm },
});
