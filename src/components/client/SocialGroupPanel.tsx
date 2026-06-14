import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, typography } from '@/lib/theme';

export function SocialGroupPanel({ groups }: { groups: string[] }) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>Squad Loops</Text>
      {groups.map((group) => (
        <View key={group} style={styles.row}>
          <Text style={styles.group}>{group}</Text>
          <Text style={styles.meta}>Open</Text>
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  group: { color: colors.textSub, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  meta: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
});
