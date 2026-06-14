import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { colors, radii, spacing, typography } from '@/lib/theme';

export interface UserTrialTimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  time?: string;
  state?: 'done' | 'active' | 'upcoming';
}

interface UserTrialTimelineProps {
  items: UserTrialTimelineItem[];
}

export function UserTrialTimeline({ items }: UserTrialTimelineProps) {
  return (
    <GlassCard padding={spacing.md} style={styles.card}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const tone = item.state ?? 'upcoming';
        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.markerCol}>
              <View style={[styles.marker, markerTone[tone]]} />
              {!isLast ? <View style={styles.track} /> : null}
            </View>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>{item.title}</Text>
                {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
              </View>
              {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
            </View>
          </View>
        );
      })}
    </GlassCard>
  );
}

const markerTone = StyleSheet.create({
  done: { backgroundColor: colors.primary },
  active: { backgroundColor: colors.clinical },
  upcoming: { backgroundColor: colors.borderStrong },
});

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  markerCol: {
    alignItems: 'center',
    width: 12,
  },
  marker: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  track: {
    marginTop: 4,
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: colors.borderSubtle,
  },
  content: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.textStrong,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.sm,
  },
  time: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  subtitle: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
});
